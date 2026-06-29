import { logger } from '../utils/logger.js';
import type { LiveComment } from './LiveComment.js';

export class CommentQueue {
  private readonly queue: LiveComment[] = [];
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly intervalMs: number,
    private readonly drainOne: (comment: LiveComment) => void,
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      const comment = this.queue.shift();
      if (!comment) {
        return;
      }
      this.drainOne(comment);

      if (this.queue.length > 200) {
        logger.warn({ queueLength: this.queue.length }, 'comment queue is growing');
      }
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  push(comment: LiveComment): void {
    this.queue.push(comment);
  }

  get length(): number {
    return this.queue.length;
  }
}
