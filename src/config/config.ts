import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { appConfigSchema, type AppConfig } from './schema.js';

export async function loadConfig(path = process.env.CONFIG_PATH ?? 'config.json'): Promise<AppConfig> {
  const filePath = resolve(process.cwd(), path);
  const raw = await readFile(filePath, 'utf8');
  return appConfigSchema.parse(JSON.parse(raw));
}
