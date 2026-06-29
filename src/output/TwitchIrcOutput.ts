import { CommentQueue } from '../core/CommentQueue.js';
import { formatLiveComment, type LiveComment } from '../core/LiveComment.js';
import type { CommentBus } from '../core/CommentBus.js';
import type { TwitchIrcServer } from '../twitch/TwitchIrcServer.js';

export class TwitchIrcOutput {
  private readonly queue: CommentQueue;

  constructor(
    bus: CommentBus,
    private readonly ircServer: TwitchIrcServer,
    private readonly format: string,
    queueIntervalMs: number,
  ) {
    this.queue = new CommentQueue(queueIntervalMs, (comment) => this.send(comment));
    bus.on('comment', (comment) => this.queue.push(comment));
  }

  start(): void {
    this.queue.start();
  }

  stop(): void {
    this.queue.stop();
  }

  getStatus(): { queueLength: number } {
    return {
      queueLength: this.queue.length,
    };
  }

  private send(comment: LiveComment): void {
    this.ircServer.broadcast(formatLiveComment(comment, this.format));
  }
}
