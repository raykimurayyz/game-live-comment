import { createServer, type Server, type Socket } from 'node:net';
import { logger } from '../utils/logger.js';
import { TwitchClientSession } from './TwitchClientSession.js';

export class TwitchIrcServer {
  private server: Server | undefined;
  private readonly sessions = new Set<TwitchClientSession>();

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {}

  async start(): Promise<void> {
    if (this.server) {
      return;
    }

    this.server = createServer((socket) => this.handleConnection(socket));

    await new Promise<void>((resolve, reject) => {
      this.server?.once('error', reject);
      this.server?.listen(this.port, this.host, () => {
        this.server?.off('error', reject);
        logger.info({ host: this.host, port: this.port }, 'twitch irc emulator listening');
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    for (const session of this.sessions) {
      session.close();
    }
    this.sessions.clear();

    if (!this.server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    this.server = undefined;
  }

  broadcast(message: string): void {
    for (const session of this.sessions) {
      session.sendMessage(message);
    }
  }

  getStatus(): { connectedClients: number; clients: ReturnType<TwitchClientSession['getStatus']>[] } {
    return {
      connectedClients: this.sessions.size,
      clients: [...this.sessions].map((session) => session.getStatus()),
    };
  }

  private handleConnection(socket: Socket): void {
    const session = new TwitchClientSession(socket);
    this.sessions.add(session);
    logger.info({ remoteAddress: socket.remoteAddress }, 'twitch client connected');
    socket.on('close', () => {
      session.close();
      this.sessions.delete(session);
    });
    session.start();
  }
}
