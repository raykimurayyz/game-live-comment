import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentBus } from '../src/core/CommentBus.js';
import { TwitchIrcOutput } from '../src/output/TwitchIrcOutput.js';
import type { TwitchIrcServer } from '../src/twitch/TwitchIrcServer.js';

describe('TwitchIrcOutput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queues comments and broadcasts formatted messages to Twitch IRC', () => {
    const bus = new CommentBus();
    const ircServer = {
      broadcast: vi.fn(),
    } as unknown as TwitchIrcServer;
    const output = new TwitchIrcOutput(bus, ircServer, '[{platform}] {username}: {content}', 100);

    output.start();
    bus.publish({
      platform: 'douyu',
      roomId: '10942092',
      username: 'Alice',
      content: 'hello',
      type: 'chat',
      timestamp: Date.now(),
    });

    expect(output.getStatus()).toEqual({ queueLength: 1 });

    vi.advanceTimersByTime(100);

    expect(ircServer.broadcast).toHaveBeenCalledWith('[斗鱼] Alice: hello');
    expect(output.getStatus()).toEqual({ queueLength: 0 });

    output.stop();
  });
});
