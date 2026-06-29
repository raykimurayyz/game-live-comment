import { EventEmitter } from 'node:events';
import type { LiveComment } from './LiveComment.js';

type CommentBusEvents = {
  comment: [LiveComment];
};

export class CommentBus {
  private readonly emitter = new EventEmitter();
  private totalComments = 0;
  private readonly recentComments: LiveComment[] = [];

  publish(comment: LiveComment): void {
    this.totalComments += 1;
    this.recentComments.unshift(comment);
    this.recentComments.splice(100);
    this.emitter.emit('comment', comment);
  }

  on<T extends keyof CommentBusEvents>(event: T, handler: (...args: CommentBusEvents[T]) => void): void {
    this.emitter.on(event, handler);
  }

  off<T extends keyof CommentBusEvents>(event: T, handler: (...args: CommentBusEvents[T]) => void): void {
    this.emitter.off(event, handler);
  }

  getStats(): { totalComments: number; recentComments: LiveComment[] } {
    return {
      totalComments: this.totalComments,
      recentComments: [...this.recentComments],
    };
  }
}
