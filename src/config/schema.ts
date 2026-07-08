import { z } from 'zod';

export const appConfigSchema = z.object({
  server: z.object({
    host: z.string().default('0.0.0.0'),
    httpPort: z.number().int().positive().default(3000),
    ircPort: z.number().int().positive().default(6667),
  }),
  platforms: z.object({
    douyu: z.object({
      enabled: z.boolean().default(true),
      roomId: z.string().default(''),
      includeGifts: z.boolean().default(false),
    }),
    huya: z.object({
      enabled: z.boolean().default(false),
      roomId: z.string().default(''),
      includeGifts: z.boolean().default(false),
    }),
  }),
  output: z.object({
    format: z.string().default('[{platform}] {username}: {content}'),
    queueIntervalMs: z.number().int().positive().default(300),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
