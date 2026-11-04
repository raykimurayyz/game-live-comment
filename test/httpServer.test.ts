import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentBus } from '../src/core/CommentBus.js';
import { HttpServer } from '../src/web/httpServer.js';

describe('HTTP request validation', () => {
  const publishTestComment = vi.fn();
  const switchRoom = vi.fn(async () => {});
  let server: HttpServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    server = new HttpServer({
      host: '127.0.0.1',
      port: 0,
      bus: new CommentBus(),
      getStatus: () => ({ ok: true }),
      publishTestComment,
      switchDouyuRoom: switchRoom,
      switchHuyaRoom: switchRoom,
      switchBilibiliRoom: switchRoom,
    });
    // Exercise the real routes and plugins without opening a listening socket.
    vi.spyOn(server['app'], 'listen').mockResolvedValue(undefined);
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
    vi.restoreAllMocks();
  });

  it('accepts an omitted test comment body', async () => {
    const response = await server['app'].inject({ method: 'POST', url: '/api/test-comment' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    expect(publishTestComment).toHaveBeenCalledWith(undefined);
  });

  it('validates and strips unknown fields from test comments', async () => {
    const comment = { username: 'Alice', content: 'hello', type: 'chat' };
    const response = await server['app'].inject({
      method: 'POST',
      url: '/api/test-comment',
      payload: { ...comment, extra: 'ignored' },
    });

    expect(response.statusCode).toBe(200);
    expect(publishTestComment).toHaveBeenCalledWith(comment);
  });

  it.each(['douyu', 'huya', 'bilibili'])('preserves room switching for %s', async (platform) => {
    const response = await server['app'].inject({
      method: 'POST',
      url: `/api/platforms/${platform}/room`,
      payload: { roomId: '123', enabled: false },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, roomId: '123', enabled: false });
    expect(switchRoom).toHaveBeenCalledWith('123', false);
  });

  it('rejects an invalid comment type before publishing', async () => {
    const response = await server['app'].inject({
      method: 'POST',
      url: '/api/test-comment',
      payload: { type: 'invalid' },
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(publishTestComment).not.toHaveBeenCalled();
  });

  it.each(['douyu', 'huya', 'bilibili'])('rejects array room IDs for %s', async (platform) => {
    const response = await server['app'].inject({
      method: 'POST',
      url: `/api/platforms/${platform}/room`,
      payload: { roomId: ['123'] },
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(switchRoom).not.toHaveBeenCalled();
  });
});
