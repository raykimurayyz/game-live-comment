import { loadConfig } from './config/config.js';
import { CommentBus } from './core/CommentBus.js';
import type { LiveComment } from './core/LiveComment.js';
import { TwitchIrcOutput } from './output/TwitchIrcOutput.js';
import { DouyuAdapter } from './platforms/douyu/DouyuAdapter.js';
import { HuyaAdapter } from './platforms/huya/HuyaAdapter.js';
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
        douyu: douyuAdapter.getStatus(),
        huya: config.platforms.huya.enabled || huyaAdapter.getStatus().status !== 'idle'
          ? huyaAdapter.getStatus()
          : {
              name: 'huya',
              status: 'disabled',
              roomId: config.platforms.huya.roomId,
            },
      },
      comments: bus.getStats(),
    }),
    publishTestComment: (comment) => {
      bus.publish(createTestComment(config.platforms.douyu.roomId, comment));
    },
    switchDouyuRoom: async (roomId) => {
      await douyuAdapter.switchRoom(roomId);
    },
    switchHuyaRoom: async (roomId) => {
      await huyaAdapter.switchRoom(roomId);
    },
  });
  await httpServer.start();

  const douyuConfigured = config.platforms.douyu.enabled && config.platforms.douyu.roomId.trim().length > 0;
  const huyaConfigured = config.platforms.huya.enabled && config.platforms.huya.roomId.trim().length > 0;

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

  if (!douyuConfigured && !huyaConfigured) {
    logger.error('no streaming platform room configured; platform adapters will not receive comments');
  }

  const shutdown = async (): Promise<void> => {
    logger.info('shutting down');
    twitchOutput.stop();
    await douyuAdapter.disconnect();
    await huyaAdapter.disconnect();
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
    username: input?.username ?? '测试用户',
    content: input?.content ?? '这是一条测试弹幕',
    type: input?.type ?? 'chat',
    timestamp: Date.now(),
  };
}

bootstrap().catch((error) => {
  logger.error({ error }, 'failed to start application');
  process.exit(1);
});
