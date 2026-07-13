import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig, saveConfig } from '../src/config/config.js';

const envKeys = [
  'SERVER_HOST',
  'HTTP_PORT',
  'IRC_PORT',
  'DOUYU_ENABLED',
  'DOUYU_ROOM_ID',
  'DOUYU_INCLUDE_GIFTS',
  'HUYA_ENABLED',
  'HUYA_ROOM_ID',
  'HUYA_INCLUDE_GIFTS',
  'BILIBILI_ENABLED',
  'BILIBILI_ROOM_ID',
  'BILIBILI_INCLUDE_GIFTS',
  'OUTPUT_FORMAT',
  'QUEUE_INTERVAL_MS',
] as const;

describe('loadConfig', () => {
  afterEach(() => {
    for (const key of envKeys) {
      delete process.env[key];
    }
  });

  it('allows environment variables to override docker-friendly config values', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gamelivecomment-config-'));
    const configPath = join(dir, 'config.json');
    await writeFile(
      configPath,
      JSON.stringify({
        server: {
          host: '0.0.0.0',
          httpPort: 3010,
          ircPort: 6667,
        },
        platforms: {
          douyu: {
            enabled: false,
            roomId: 'old-douyu',
            includeGifts: false,
          },
          huya: {
            enabled: false,
            roomId: 'old-huya',
            includeGifts: false,
          },
          bilibili: {
            enabled: false,
            roomId: 'old-bilibili',
            includeGifts: false,
          },
        },
        output: {
          format: '[{platform}] {username}: {content}',
          queueIntervalMs: 300,
        },
      }),
    );

    process.env.HTTP_PORT = '3011';
    process.env.DOUYU_ROOM_ID = '123';
    process.env.HUYA_ROOM_ID = '456';
    process.env.BILIBILI_ROOM_ID = '789';
    process.env.QUEUE_INTERVAL_MS = '500';

    const config = await loadConfig(configPath);

    expect(config.server.httpPort).toBe(3011);
    expect(config.platforms.douyu.enabled).toBe(true);
    expect(config.platforms.douyu.roomId).toBe('123');
    expect(config.platforms.huya.enabled).toBe(true);
    expect(config.platforms.huya.roomId).toBe('456');
    expect(config.platforms.bilibili.enabled).toBe(true);
    expect(config.platforms.bilibili.roomId).toBe('789');
    expect(config.output.queueIntervalMs).toBe(500);

    await rm(dir, { recursive: true, force: true });
  });

  it('allows explicit enabled=false to disable a platform even when room id is provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gamelivecomment-config-'));
    const configPath = join(dir, 'config.json');
    await writeFile(
      configPath,
      JSON.stringify({
        server: {
          host: '0.0.0.0',
          httpPort: 3010,
          ircPort: 6667,
        },
        platforms: {
          douyu: {
            enabled: true,
            roomId: 'old-douyu',
            includeGifts: false,
          },
          huya: {
            enabled: true,
            roomId: 'old-huya',
            includeGifts: false,
          },
          bilibili: {
            enabled: true,
            roomId: 'old-bilibili',
            includeGifts: false,
          },
        },
        output: {
          format: '[{platform}] {username}: {content}',
          queueIntervalMs: 300,
        },
      }),
    );

    process.env.DOUYU_ENABLED = 'false';
    process.env.DOUYU_ROOM_ID = '123';

    const config = await loadConfig(configPath);

    expect(config.platforms.douyu.enabled).toBe(false);
    expect(config.platforms.douyu.roomId).toBe('123');

    await rm(dir, { recursive: true, force: true });
  });

  it('saves config changes so they can be loaded again', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gamelivecomment-config-'));
    const configPath = join(dir, 'config.json');
    const config = {
      server: {
        host: '0.0.0.0',
        httpPort: 3010,
        ircPort: 6667,
      },
      platforms: {
        douyu: {
          enabled: false,
          roomId: '',
          includeGifts: false,
        },
        huya: {
          enabled: true,
          roomId: '27367112',
          includeGifts: false,
        },
        bilibili: {
          enabled: false,
          roomId: '',
          includeGifts: false,
        },
      },
      output: {
        format: '[{platform}] {username}: {content}',
        queueIntervalMs: 300,
      },
    };

    await saveConfig(config, configPath);
    const loaded = await loadConfig(configPath);

    expect(loaded.platforms.huya.enabled).toBe(true);
    expect(loaded.platforms.huya.roomId).toBe('27367112');
    expect(loaded.platforms.douyu.enabled).toBe(false);

    await rm(dir, { recursive: true, force: true });
  });
});
