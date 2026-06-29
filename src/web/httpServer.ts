import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { CommentBus } from '../core/CommentBus.js';
import type { LiveComment } from '../core/LiveComment.js';
import { logger } from '../utils/logger.js';
import { overlayHtml } from './overlayHtml.js';

type HttpServerOptions = {
  host: string;
  port: number;
  bus: CommentBus;
  getStatus: () => unknown;
  publishTestComment: (comment?: Partial<LiveComment>) => void;
  switchDouyuRoom: (roomId: string) => Promise<void>;
};

const testCommentSchema = z
  .object({
    username: z.string().optional(),
    content: z.string().optional(),
    type: z.enum(['chat', 'gift', 'system']).optional(),
  })
  .optional();

const switchRoomSchema = z.object({
  roomId: z.string().min(1),
});

export class HttpServer {
  private readonly app: FastifyInstance;
  private readonly clients = new Set<{ send: (payload: string) => void }>();

  constructor(private readonly options: HttpServerOptions) {
    this.app = Fastify({
      logger: false,
    });
  }

  async start(): Promise<void> {
    await this.app.register(websocket);
    this.registerRoutes();
    this.options.bus.on('comment', (comment) => this.broadcastComment(comment));

    await this.app.listen({
      host: this.options.host,
      port: this.options.port,
    });

    logger.info({ host: this.options.host, port: this.options.port }, 'http server listening');
  }

  async stop(): Promise<void> {
    await this.app.close();
  }

  getStatus(): { webClients: number } {
    return {
      webClients: this.clients.size,
    };
  }

  private registerRoutes(): void {
    this.app.get('/overlay', async (_request, reply) => {
      reply.type('text/html; charset=utf-8').send(overlayHtml);
    });

    this.app.get('/api/status', async () => this.options.getStatus());

    this.app.post('/api/test-comment', async (request) => {
      const input = testCommentSchema.parse(request.body);
      this.options.publishTestComment(input);
      return { ok: true };
    });

    this.app.post('/api/platforms/douyu/room', async (request) => {
      const input = switchRoomSchema.parse(request.body);
      await this.options.switchDouyuRoom(input.roomId);
      return { ok: true, roomId: input.roomId };
    });

    this.app.get('/ws/comments', { websocket: true }, (socket) => {
      const client = {
        send: (payload: string) => socket.send(payload),
      };
      this.clients.add(client);
      socket.on('close', () => {
        this.clients.delete(client);
      });
    });
  }

  private broadcastComment(comment: LiveComment): void {
    const payload = JSON.stringify({
      event: 'comment',
      comment,
    });

    for (const client of this.clients) {
      client.send(payload);
    }
  }
}
