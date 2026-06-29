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
    this.stopped = false;
    this.status = 'connecting';
    this.clearReconnectTimer();

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
        this.handleMessages(decodeDouyuPackets(buffer));
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
}
