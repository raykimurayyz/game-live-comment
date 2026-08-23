import { loadConfig, saveConfig } from './config/config.js';
import type { AppConfig } from './config/schema.js';
import { CommentBus } from './core/CommentBus.js';
import type { LiveComment } from './core/LiveComment.js';
import { TwitchIrcOutput } from './output/TwitchIrcOutput.js';
import { BilibiliAdapter } from './platforms/bilibili/BilibiliAdapter.js';
import { DouyuAdapter } from './platforms/douyu/DouyuAdapter.js';
import { HuyaAdapter } from './platforms/huya/HuyaAdapter.js';
import type { PlatformAdapter } from './platforms/PlatformAdapter.js';
import { TwitchIrcServer } from './twitch/TwitchIrcServer.js';
import { logger } from './utils/logger.js';
import { HttpServer } from './web/httpServer.js';

async function bootstrap(): Promise<void> {
  const config = await loadConfig();
  const bus = new CommentBus();

  const twitchServer = new TwitchIrcServer(config.server.host, config.server.ircPort);
  await twitchServer.start();

  const twitchOutput = new TwitchIrcOutput(
    bus,
    twitchServer,
    config.output.format,
    config.output.queueIntervalMs,
  );
  twitchOutput.start();

  const douyuAdapter = new DouyuAdapter({
    roomId: config.platforms.douyu.roomId,
    includeGifts: config.platforms.douyu.includeGifts,
  });
  douyuAdapter.onComment((comment) => bus.publish(comment));

  const huyaAdapter = new HuyaAdapter({
    roomId: config.platforms.huya.roomId,
    includeGifts: config.platforms.huya.includeGifts,
  });
  huyaAdapter.onComment((comment) => bus.publish(comment));

  const bilibiliAdapter = new BilibiliAdapter({
    roomId: config.platforms.bilibili.roomId,
    includeGifts: config.platforms.bilibili.includeGifts,
  });
  bilibiliAdapter.onComment((comment) => bus.publish(comment));

  let httpServer: HttpServer;
  httpServer = new HttpServer({
    host: config.server.host,
    port: config.server.httpPort,
    bus,
    getStatus: (): unknown => ({
      twitch: twitchServer.getStatus(),
      output: twitchOutput.getStatus(),
      web: httpServer.getStatus(),
      platforms: {
        douyu: getPlatformStatus(config, 'douyu', douyuAdapter),
        huya: getPlatformStatus(config, 'huya', huyaAdapter),
        bilibili: getPlatformStatus(config, 'bilibili', bilibiliAdapter),
      },
      comments: bus.getStats(),
    }),
    publishTestComment: (comment) => {
      bus.publish(createTestComment(config.platforms.douyu.roomId, comment));
    },
    switchDouyuRoom: async (roomId, enabled) => switchPlatformRoom(config, 'douyu', douyuAdapter, roomId, enabled),
    switchHuyaRoom: async (roomId, enabled) => switchPlatformRoom(config, 'huya', huyaAdapter, roomId, enabled),
    switchBilibiliRoom: async (roomId, enabled) =>
      switchPlatformRoom(config, 'bilibili', bilibiliAdapter, roomId, enabled),
  });
  await httpServer.start();

  const douyuConfigured = config.platforms.douyu.enabled && config.platforms.douyu.roomId.trim().length > 0;
  const huyaConfigured = config.platforms.huya.enabled && config.platforms.huya.roomId.trim().length > 0;
  const bilibiliConfigured = config.platforms.bilibili.enabled && config.platforms.bilibili.roomId.trim().length > 0;

  if (douyuConfigured) {
    await douyuAdapter.connect();
  } else if (config.platforms.douyu.enabled) {
    logger.error('douyu adapter enabled but DOUYU_ROOM_ID/platforms.douyu.roomId is not configured');
  } else {
    logger.info({ roomId: config.platforms.douyu.roomId }, 'douyu adapter disabled');
  }

  if (huyaConfigured) {
    await huyaAdapter.connect();
  } else if (config.platforms.huya.enabled) {
    logger.error('huya adapter enabled but HUYA_ROOM_ID/platforms.huya.roomId is not configured');
  } else {
    logger.info({ roomId: config.platforms.huya.roomId }, 'huya adapter disabled');
  }

  if (bilibiliConfigured) {
    await bilibiliAdapter.connect();
  } else if (config.platforms.bilibili.enabled) {
    logger.error('bilibili adapter enabled but BILIBILI_ROOM_ID/platforms.bilibili.roomId is not configured');
  } else {
    logger.info({ roomId: config.platforms.bilibili.roomId }, 'bilibili adapter disabled');
  }

  if (!douyuConfigured && !huyaConfigured && !bilibiliConfigured) {
    logger.error('no streaming platform room configured; platform adapters will not receive comments');
  }

  const shutdown = async (): Promise<void> => {
    logger.info('shutting down');
    twitchOutput.stop();
    await douyuAdapter.disconnect();
    await huyaAdapter.disconnect();
    await bilibiliAdapter.disconnect();
    await httpServer.stop();
    await twitchServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

function createTestComment(roomId: string, input?: Partial<LiveComment>): LiveComment {
  return {
    platform: input?.platform ?? 'mock',
    roomId: input?.roomId ?? roomId,
    username: input?.username ?? 'Test User',
    content: input?.content ?? 'This is a test comment',
    type: input?.type ?? 'chat',
    timestamp: Date.now(),
  };
}

function getPlatformStatus(
  config: AppConfig,
  platform: keyof AppConfig['platforms'],
  adapter: PlatformAdapter,
): ReturnType<PlatformAdapter['getStatus']> & { enabled: boolean } {
  const platformConfig = config.platforms[platform];
  if (!platformConfig.enabled) {
    return {
      name: platform,
      status: 'disabled',
      roomId: platformConfig.roomId,
      enabled: false,
    };
  }

  return {
    ...adapter.getStatus(),
    enabled: true,
  };
}

async function switchPlatformRoom(
  config: AppConfig,
  platform: keyof AppConfig['platforms'],
  adapter: PlatformAdapter,
  roomId: string,
  enabled: boolean | undefined,
): Promise<void> {
  const nextRoomId = roomId.trim();
  const nextEnabled = nextRoomId.length > 0 && (enabled ?? true);

  config.platforms[platform].roomId = nextRoomId;
  config.platforms[platform].enabled = nextEnabled;

  if (!nextEnabled) {
    await adapter.disconnect();
    await saveConfig(config);
    return;
  }

  await adapter.switchRoom(nextRoomId);
  await saveConfig(config);
}

bootstrap().catch((error) => {
  logger.error({ error }, 'failed to start application');
  process.exit(1);
});
