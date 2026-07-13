import { EventEmitter } from 'node:events';
import { BilibiliApiClient, LiveWS, parseLiveConfig, type MessageData } from 'bilibili-live-danmaku';
import WebSocket from 'ws';
import type { LiveComment } from '../../core/LiveComment.js';
import { logger } from '../../utils/logger.js';
import type { PlatformAdapter, PlatformStatus } from '../PlatformAdapter.js';

type BilibiliAdapterOptions = {
  roomId: string;
  includeGifts: boolean;
};

type BilibiliRoomInfo = {
  roomId: number;
  liveStatus: number;
};

export class BilibiliAdapter implements PlatformAdapter {
  readonly name = 'bilibili';
  private client: LiveWS | undefined;
  private readonly api = new BilibiliApiClient();
  private readonly emitter = new EventEmitter();
  private status: PlatformStatus = 'idle';
  private lastError: string | undefined;
  private stopped = false;
  private reconnectTimer: NodeJS.Timeout | undefined;

  constructor(private options: BilibiliAdapterOptions) {
    this.ensureWebSocketGlobal();
  }

  async connect(): Promise<void> {
    const roomId = this.options.roomId.trim();
    if (!roomId) {
      this.failStartup('bilibili room id is not configured');
      return;
    }

    this.stopped = false;
    this.status = 'connecting';
    this.clearReconnectTimer();

    const roomInfo = await this.resolveRoomInfo(roomId);
    if (!roomInfo) {
      this.failStartup(`bilibili room does not exist or is unavailable: ${roomId}`);
      return;
    }

    await this.openWebSocket(roomInfo);
  }

  async disconnect(): Promise<void> {
    this.stopped = true;
    this.status = 'disconnected';
    this.clearReconnectTimer();
    this.client?.close();
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
    if (!roomId.trim()) {
      this.status = 'disabled';
      this.lastError = undefined;
      return;
    }
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

  private async openWebSocket(roomInfo: BilibiliRoomInfo): Promise<void> {
    try {
      const danmuInfo = await this.api.xliveGetDanmuInfo({ id: roomInfo.roomId });
      const liveConfig = parseLiveConfig(danmuInfo.data);
      const client = new LiveWS(roomInfo.roomId, {
        address: liveConfig.address,
        key: liveConfig.key,
        protover: 3,
      });
      this.client = client;

      await new Promise<void>((resolve) => {
        let resolved = false;
        const settle = (): void => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        client.addEventListener('CONNECT_SUCCESS', () => {
          this.status = 'connected';
          this.lastError = undefined;
          logger.info(
            {
              roomId: this.options.roomId,
              resolvedRoomId: roomInfo.roomId,
              liveStatus: roomInfo.liveStatus,
            },
            'connected to bilibili danmaku server',
          );
          settle();
        });

        client.addEventListener('DANMU_MSG', (event) => {
          this.handleDanmakuMessage(event.data);
        });

        client.addEventListener('SEND_GIFT', (event) => {
          this.handleGiftMessage(event.data);
        });

        client.addEventListener('error', (event) => {
          this.status = 'error';
          this.lastError = this.describeEventError(event);
          logger.warn({ error: this.lastError }, 'bilibili websocket error');
          settle();
        });

        client.addEventListener('error:decode', (event) => {
          logger.debug({ error: this.describeEventError(event) }, 'bilibili message decode error');
        });

        client.addEventListener('close', () => {
          if (!this.stopped) {
            this.status = 'disconnected';
            logger.warn('bilibili websocket closed, scheduling reconnect');
            this.scheduleReconnect();
          }
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.status = 'error';
      this.lastError = message;
      logger.warn({ error, roomId: this.options.roomId }, 'failed to connect bilibili danmaku server');
    }
  }

  private handleDanmakuMessage(message: MessageData.DANMU_MSG): void {
    this.emitComment({
      platform: 'bilibili',
      roomId: this.options.roomId,
      username: message.info?.[2]?.[1] || 'B站用户',
      content: message.info?.[1] || '',
      type: 'chat',
      timestamp: Date.now(),
    });
  }

  private handleGiftMessage(message: MessageData.SEND_GIFT): void {
    if (!this.options.includeGifts) {
      return;
    }

    this.emitComment({
      platform: 'bilibili',
      roomId: this.options.roomId,
      username: message.data?.uname || 'B站用户',
      content: `送出礼物 ${message.data?.giftName || ''}${message.data?.num ? ` x${message.data.num}` : ''}`.trim(),
      type: 'gift',
      timestamp: Date.now(),
    });
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

  private async resolveRoomInfo(roomId: string): Promise<BilibiliRoomInfo | undefined> {
    const numericRoomId = Number(roomId);
    if (!Number.isInteger(numericRoomId) || numericRoomId <= 0) {
      this.lastError = `bilibili room id must be a positive number: ${roomId}`;
      return undefined;
    }

    try {
      const response = await this.api.liveRoomInit({ id: numericRoomId });
      const resolvedRoomId = Number(response.data?.room_id);
      if (!Number.isInteger(resolvedRoomId) || resolvedRoomId <= 0) {
        this.lastError = `failed to resolve bilibili room id: ${roomId}`;
        return undefined;
      }

      if (response.data?.is_hidden || response.data?.is_locked) {
        this.lastError = `bilibili room is hidden or locked: ${roomId}`;
        return undefined;
      }

      return {
        roomId: resolvedRoomId,
        liveStatus: Number(response.data?.live_status ?? 0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      logger.warn({ error, roomId }, 'failed to resolve bilibili room info');
      return undefined;
    }
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

  private ensureWebSocketGlobal(): void {
    Object.assign(globalThis, { WebSocket });
  }

  private describeEventError(event: Event): string {
    const error = (event as Event & { error?: unknown }).error;
    if (error instanceof Error) {
      return error.message;
    }
    if (error) {
      return String(error);
    }
    return event.type;
  }

  private failStartup(message: string): void {
    this.status = 'error';
    this.lastError = message;
    this.stopped = true;
    logger.error({ roomId: this.options.roomId }, message);
  }
}
