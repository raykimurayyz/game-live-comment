import type { LiveComment } from '../core/LiveComment.js';

export type PlatformStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'disabled' | 'error';

export interface PlatformAdapter {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onComment(handler: (comment: LiveComment) => void): void;
  getStatus(): {
    name: string;
    status: PlatformStatus;
    roomId: string;
    lastError?: string;
  };
}
