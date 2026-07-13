import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { appConfigSchema, type AppConfig } from './schema.js';

export async function loadConfig(path = process.env.CONFIG_PATH ?? 'config.json'): Promise<AppConfig> {
  const filePath = resolve(process.cwd(), path);
  const raw = await readFile(filePath, 'utf8');
  return appConfigSchema.parse(applyEnvOverrides(JSON.parse(raw)));
}

export async function saveConfig(config: AppConfig, path = process.env.CONFIG_PATH ?? 'config.json'): Promise<void> {
  const filePath = resolve(process.cwd(), path);
  const parsed = appConfigSchema.parse(config);
  await writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
}

function applyEnvOverrides(config: unknown): unknown {
  const next = structuredClone(config) as Record<string, unknown>;
  const server = ensureObject(next, 'server');
  const platforms = ensureObject(next, 'platforms');
  const douyu = ensureObject(platforms, 'douyu');
  const huya = ensureObject(platforms, 'huya');
  const bilibili = ensureObject(platforms, 'bilibili');
  const output = ensureObject(next, 'output');

  setString(server, 'host', process.env.SERVER_HOST);
  setNumber(server, 'httpPort', process.env.HTTP_PORT);
  setNumber(server, 'ircPort', process.env.IRC_PORT);

  setPlatformEnv(douyu, process.env.DOUYU_ENABLED, process.env.DOUYU_ROOM_ID);
  setBoolean(douyu, 'includeGifts', process.env.DOUYU_INCLUDE_GIFTS);

  setPlatformEnv(huya, process.env.HUYA_ENABLED, process.env.HUYA_ROOM_ID);
  setBoolean(huya, 'includeGifts', process.env.HUYA_INCLUDE_GIFTS);

  setPlatformEnv(bilibili, process.env.BILIBILI_ENABLED, process.env.BILIBILI_ROOM_ID);
  setBoolean(bilibili, 'includeGifts', process.env.BILIBILI_INCLUDE_GIFTS);

  setString(output, 'format', process.env.OUTPUT_FORMAT);
  setNumber(output, 'queueIntervalMs', process.env.QUEUE_INTERVAL_MS);

  return next;
}

function ensureObject(parent: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = parent[key];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  const object: Record<string, unknown> = {};
  parent[key] = object;
  return object;
}

function setString(target: Record<string, unknown>, key: string, value: string | undefined): void {
  if (value !== undefined && value !== '') {
    target[key] = value;
  }
}

function setNumber(target: Record<string, unknown>, key: string, value: string | undefined): void {
  if (value !== undefined && value !== '') {
    target[key] = Number(value);
  }
}

function setBoolean(target: Record<string, unknown>, key: string, value: string | undefined): void {
  if (value === undefined || value === '') {
    return;
  }

  target[key] = parseBoolean(value);
}

function setPlatformEnv(target: Record<string, unknown>, enabledValue: string | undefined, roomIdValue: string | undefined): void {
  const hasRoomIdOverride = roomIdValue !== undefined && roomIdValue !== '';
  const enabledOverride = parseOptionalBoolean(enabledValue);

  setString(target, 'roomId', roomIdValue);

  if (enabledOverride !== undefined) {
    target.enabled = enabledOverride;
    return;
  }

  if (hasRoomIdOverride) {
    target.enabled = true;
  }
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  return parseBoolean(value);
}

function parseBoolean(value: string): boolean {
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}
