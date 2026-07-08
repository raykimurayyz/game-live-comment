import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import type { LiveComment } from '../../core/LiveComment.js';
import { logger } from '../../utils/logger.js';
import type { PlatformAdapter, PlatformStatus } from '../PlatformAdapter.js';
import {
  createHeartbeatRequest,
  createJoinGroupRequest,
  createLoginRequest,
  decodeDouyuPackets,
  type DouyuMessage,
} from './douyuProtocol.js';

type DouyuAdapterOptions = {
  roomId: string;
  includeGifts: boolean;
};

export class DouyuAdapter implements PlatformAdapter {
  readonly name = 'douyu';
  private ws: WebSocket | undefined;
  private heartbeatTimer: NodeJS.Timeout | undefined;
  private reconnectTimer: NodeJS.Timeout | undefined;
  private readonly emitter = new EventEmitter();
  private status: PlatformStatus = 'idle';
  private lastError: string | undefined;
  private stopped = false;

  constructor(private options: DouyuAdapterOptions) {}

  async connect(): Promise<void> {
    const roomId = this.options.roomId.trim();
    if (!roomId) {
      this.failStartup('douyu room id is not configured');
      return;
    }

    this.stopped = false;
    this.status = 'connecting';
    this.clearReconnectTimer();

    const roomExists = await this.checkRoomExists(roomId);
    if (!roomExists) {
      this.failStartup(`douyu room does not exist or is unavailable: ${roomId}`);
      return;
    }

    await this.openWebSocket();
  }

  async disconnect(): Promise<void> {
    this.stopped = true;
    this.status = 'disconnected';
    this.clearHeartbeatTimer();
    this.clearReconnectTimer();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = undefined;
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

  private async openWebSocket(): Promise<void> {
    await new Promise<void>((resolve) => {
      const ws = new WebSocket('wss://danmuproxy.douyu.com:8506/', {
        perMessageDeflate: false,
      });
      this.ws = ws;

      ws.on('open', () => {
        this.status = 'connected';
        this.lastError = undefined;
        ws.send(createLoginRequest(this.options.roomId));
        ws.send(createJoinGroupRequest(this.options.roomId));
        this.startHeartbeat();
        logger.info({ roomId: this.options.roomId }, 'connected to douyu danmaku server');
        resolve();
      });

      ws.on('message', (data) => {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
        const messages = decodeDouyuPackets(buffer);
        logger.debug(
          {
            bytes: buffer.length,
            messageCount: messages.length,
            messageTypes: messages.map((message) => message.type).slice(0, 10),
          },
          'received douyu packet',
        );
        this.handleMessages(messages);
      });

      ws.on('close', () => {
        this.clearHeartbeatTimer();
        if (!this.stopped) {
          this.status = 'disconnected';
          logger.warn('douyu websocket closed, scheduling reconnect');
          this.scheduleReconnect();
        }
      });

      ws.on('error', (error) => {
        this.lastError = error.message;
        this.status = 'error';
        logger.warn({ error }, 'douyu websocket error');
        resolve();
      });
    });
  }

  private handleMessages(messages: DouyuMessage[]): void {
    for (const message of messages) {
      if (message.type === 'chatmsg') {
        this.emitComment({
          platform: 'douyu',
          roomId: this.options.roomId,
          username: message.nn || message.uid || '斗鱼用户',
          content: message.txt || '',
          type: 'chat',
          timestamp: Date.now(),
        });
      }

      if (this.options.includeGifts && message.type === 'dgb') {
        this.emitComment({
          platform: 'douyu',
          roomId: this.options.roomId,
          username: message.nn || message.uid || '斗鱼用户',
          content: `送出礼物 ${message.gfid || ''}${message.gfcnt ? ` x${message.gfcnt}` : ''}`.trim(),
          type: 'gift',
          timestamp: Date.now(),
        });
      }
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

  private startHeartbeat(): void {
    this.clearHeartbeatTimer();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(createHeartbeatRequest());
      }
    }, 45_000);
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, 5_000);
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private async checkRoomExists(roomId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://open.douyucdn.cn/api/RoomApi/room/${encodeURIComponent(roomId)}`);
      if (!response.ok) {
        logger.warn({ roomId, status: response.status }, 'douyu room preflight request failed, continuing');
        return true;
      }

      const payload = (await response.json()) as {
        error?: number;
        msg?: string;
        data?: {
          room_id?: number | string;
        };
      };

      if (payload.error === 0 && payload.data?.room_id) {
        return true;
      }

      this.lastError = payload.msg || `douyu room not found: ${roomId}`;
      return false;
    } catch (error) {
      logger.warn({ error, roomId }, 'douyu room preflight request failed, continuing');
      return true;
    }
  }

  private failStartup(message: string): void {
    this.status = 'error';
    this.lastError = message;
    this.stopped = true;
    logger.error({ roomId: this.options.roomId }, message);
  }
}
