import 'server-only';

import { z } from 'zod';

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export const env = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});
