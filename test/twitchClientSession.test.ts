import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TwitchClientSession } from '../src/twitch/TwitchClientSession.js';

class FakeSocket extends EventEmitter {
  readonly writes: string[] = [];
  remoteAddress = '127.0.0.1';

  setEncoding(_encoding: BufferEncoding): this {
    return this;
  }

  write(data: string, callback?: (error?: Error) => void): boolean {
    this.writes.push(data);
    callback?.();
    return true;
  }
}

describe('TwitchClientSession', () => {
  let socket: FakeSocket;
  let session: TwitchClientSession;

  beforeEach(() => {
    vi.useFakeTimers();
    socket = new FakeSocket();
    session = new TwitchClientSession(socket as never);
    session.start();
  });

  afterEach(() => {
    session.close();
    vi.useRealTimers();
  });

  it('acknowledges Twitch capability requests', () => {
    socket.emit('data', 'CAP REQ :twitch.tv/tags\r\n');

    expect(socket.writes).toContain(':tmi.twitch.tv CAP * ACK :twitch.tv/tags\r\n');
  });

  it('sends handshake and join responses', () => {
    socket.emit('data', 'PASS oauth:test\r\nNICK ps5test\r\nJOIN #ps5test\r\n');

    expect(socket.writes).toContain(':tmi.twitch.tv 001 ps5test :Welcome, GLHF!\r\n');
    expect(socket.writes).toContain(':ps5test!ps5test@ps5test.tmi.twitch.tv JOIN #ps5test\r\n');
    expect(socket.writes).toContain(':tmi.twitch.tv 366 ps5test #ps5test :End of /NAMES list\r\n');
  });

  it('responds to client ping', () => {
    socket.emit('data', 'PING :client\r\n');

    expect(socket.writes).toContain('PONG :tmi.twitch.tv\r\n');
  });

  it('broadcasts comments as PRIVMSG to the joined channel', () => {
    socket.emit('data', 'NICK ps5test\r\nJOIN #ps5test\r\n');

    session.sendMessage('[斗鱼] 用户: hello');

    expect(socket.writes).toContain(
      ':ps5test!ps5test@ps5test.tmi.twitch.tv PRIVMSG #ps5test :[斗鱼] 用户: hello\r\n',
    );
  });

  it('stops writing after close', () => {
    session.close();
    const writeCount = socket.writes.length;

    session.sendMessage('ignored');

    expect(socket.writes).toHaveLength(writeCount);
  });
});
