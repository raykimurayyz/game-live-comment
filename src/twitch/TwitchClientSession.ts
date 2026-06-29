import type { Socket } from 'node:net';
import { logger } from '../utils/logger.js';

export class TwitchClientSession {
  private readonly sessionId = Math.random().toString(36).slice(2, 10);
  private nick = 'ps5viewer';
  private channel = 'ps5viewer';
  private pingTimer: NodeJS.Timeout | undefined;
  private closed = false;

  constructor(private readonly socket: Socket) {}

  start(): void {
    this.socket.setEncoding('utf8');
    this.socket.on('data', (chunk) => this.handleData(String(chunk)));
    this.socket.on('error', (error) => {
      logger.warn({ error }, 'twitch client socket error');
    });
    this.socket.on('close', () => this.close());
    this.pingTimer = setInterval(() => this.write('PING :tmi.twitch.tv'), 15_000);
  }

  sendMessage(message: string): void {
    if (this.closed) {
      return;
    }

    const sender = this.nick || 'danmaku';
    this.write(`:${sender}!${sender}@${sender}.tmi.twitch.tv PRIVMSG #${this.channel} :${message}`);
  }

  close(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    logger.info({ sessionId: this.sessionId }, 'twitch client disconnected');
  }

  getStatus(): { sessionId: string; nick: string; channel: string; remoteAddress?: string } {
    return {
      sessionId: this.sessionId,
      nick: this.nick,
      channel: this.channel,
      remoteAddress: this.socket.remoteAddress,
    };
  }

  private handleData(data: string): void {
    for (const line of data.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
      logger.debug({ line }, 'received twitch irc line');
      this.handleLine(line);
    }
  }

  private handleLine(line: string): void {
    const [command, ...rest] = line.split(' ');
    const upperCommand = command.toUpperCase();

    if (upperCommand === 'CAP') {
      this.write(':tmi.twitch.tv CAP * ACK :twitch.tv/tags');
      return;
    }

    if (upperCommand === 'NICK') {
      this.nick = rest[0] || this.nick;
      this.channel = this.nick;
      this.sendHandshake();
      return;
    }

    if (upperCommand === 'PASS') {
      return;
    }

    if (upperCommand === 'JOIN') {
      this.channel = (rest[0] || this.channel).replace(/^#/, '');
      this.write(`:${this.nick}!${this.nick}@${this.nick}.tmi.twitch.tv JOIN #${this.channel}`);
      this.write(`:tmi.twitch.tv 353 ${this.nick} = #${this.channel} :${this.nick}`);
      this.write(`:tmi.twitch.tv 366 ${this.nick} #${this.channel} :End of /NAMES list`);
      return;
    }

    if (upperCommand === 'PONG') {
      return;
    }

    if (upperCommand === 'PING') {
      this.write('PONG :tmi.twitch.tv');
    }
  }

  private sendHandshake(): void {
    this.write(`:tmi.twitch.tv 001 ${this.nick} :Welcome, GLHF!`);
    this.write(`:tmi.twitch.tv 002 ${this.nick} :Your host is tmi.twitch.tv`);
    this.write(`:tmi.twitch.tv 003 ${this.nick} :This server is rather new`);
    this.write(`:tmi.twitch.tv 004 ${this.nick} :-`);
    this.write(`:tmi.twitch.tv 375 ${this.nick} :-`);
    this.write(`:tmi.twitch.tv 372 ${this.nick} :Local game live comment bridge`);
    this.write(`:tmi.twitch.tv 376 ${this.nick} :>`);
  }

  private write(line: string): void {
    if (this.closed) {
      return;
    }

    this.socket.write(`${line}\r\n`, (error) => {
      if (error) {
        logger.warn({ error }, 'failed to write twitch irc line');
      }
    });
  }
}
