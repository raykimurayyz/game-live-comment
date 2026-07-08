import { EventEmitter } from 'node:events';
import HuyaDanmu, { type HuyaMessage } from 'huya-danmu';
import type { LiveComment } from '../../core/LiveComment.js';
import { logger } from '../../utils/logger.js';
import type { PlatformAdapter, PlatformStatus } from '../PlatformAdapter.js';

type HuyaAdapterOptions = {
  roomId: string;
  includeGifts: boolean;
};

export class HuyaAdapter implements PlatformAdapter {
  readonly name = 'huya';
  private client: HuyaDanmu | undefined;
  private readonly emitter = new EventEmitter();
  private status: PlatformStatus = 'idle';
  private lastError: string | undefined;
  private stopped = false;
  private reconnectTimer: NodeJS.Timeout | undefined;

  constructor(private options: HuyaAdapterOptions) {}

  async connect(): Promise<void> {
    this.stopped = false;
    this.status = 'connecting';
    this.clearReconnectTimer();

    const client = new HuyaDanmu(this.options.roomId);
    this.patchChatInfoResolver(client);
    this.client = client;

    client.on('connect', () => {
      this.status = 'connected';
      this.lastError = undefined;
      logger.info({ roomId: this.options.roomId }, 'connected to huya danmaku server');
    });

    client.on('message', (message) => this.handleMessage(message));

    client.on('error', (error) => {
      this.status = 'error';
      this.lastError = error.message;
      logger.warn({ error }, 'huya danmaku error');
    });

    client.on('close', () => {
      if (!this.stopped) {
        this.status = 'disconnected';
        logger.warn('huya client closed, scheduling reconnect');
        this.scheduleReconnect();
      }
    });

    client.start();
  }

  async disconnect(): Promise<void> {
    this.stopped = true;
    this.status = 'disconnected';
    this.clearReconnectTimer();
    this.client?.stop();
    this.client = undefined;
  }

  onComment(handler: (comment: LiveComment) => void): void {
    this.emitter.on('comment', handler);
  }

  async switchRoom(roomId: string): Promise<void> {
    this.options = {
      ...this.options,
      roomId,
    };
    await this.disconnect();
    await this.connect();
  }

  getStatus(): { name: string; status: PlatformStatus; roomId: string; lastError?: string } {
    return {
      name: this.name,
      status: this.status,
      roomId: this.options.roomId,
      lastError: this.lastError,
    };
  }

  private handleMessage(message: HuyaMessage): void {
    if (message.type === 'chat') {
      this.emitComment({
        platform: 'huya',
        roomId: this.options.roomId,
        username: message.from.name || '虎牙用户',
        content: message.content,
        type: 'chat',
        timestamp: Date.now(),
      });
      return;
    }

    if (this.options.includeGifts && message.type === 'gift') {
      this.emitComment({
        platform: 'huya',
        roomId: this.options.roomId,
        username: message.from.name || '虎牙用户',
        content: `送出礼物 ${message.name}${message.count ? ` x${message.count}` : ''}`.trim(),
        type: 'gift',
        timestamp: Date.now(),
      });
    }
  }

  private emitComment(comment: LiveComment): void {
    if (!comment.content) {
      return;
    }
    logger.info(
      {
        platform: comment.platform,
        roomId: comment.roomId,
        username: comment.username,
        type: comment.type,
        content: comment.content,
      },
      'received live comment',
    );
    this.emitter.emit('comment', comment);
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, 5_000);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private patchChatInfoResolver(client: HuyaDanmu): void {
    const unsafeClient = client as unknown as {
      _roomid: string;
      _get_chat_info: () => Promise<{ subsid: number; topsid: number; yyuid: number } | undefined>;
    };

    unsafeClient._get_chat_info = async () => {
      try {
        const response = await fetch(`https://m.huya.com/${unsafeClient._roomid}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Mobile Safari/537.36',
          },
        });
        const html = await response.text();
        const globalInitMatch = html.match(/window\.HNF_GLOBAL_INIT\s?=\s?(.+?)<\/script>/);

        if (globalInitMatch?.[1]) {
          const globalInit = JSON.parse(globalInitMatch[1]);
          const yyuid = Number(globalInit?.roomProfile?.lUid);
          if (Number.isFinite(yyuid) && yyuid > 0) {
            return {
              subsid: 0,
              topsid: 0,
              yyuid,
            };
          }
        }

        const yyuidMatch = html.match(/ayyuid:\s*['"](\d+)['"]/);
        const topsidMatch = html.match(/var TOPSID = ['"](\d*)['"]/);
        const subsidMatch = html.match(/var SUBSID = ['"](\d*)['"]/);
        const yyuid = yyuidMatch?.[1] ? Number(yyuidMatch[1]) : Number.NaN;
        if (Number.isFinite(yyuid) && yyuid > 0) {
          return {
            subsid: subsidMatch?.[1] ? Number(subsidMatch[1]) : 0,
            topsid: topsidMatch?.[1] ? Number(topsidMatch[1]) : 0,
            yyuid,
          };
        }

        throw new Error('failed to parse huya room info');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.lastError = message;
        logger.warn({ error, roomId: this.options.roomId }, 'failed to resolve huya room info');
        return undefined;
      }
    };
  }
}
