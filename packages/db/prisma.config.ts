import 'dotenv/config';

import { defineConfig } from 'prisma/config';

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to load Prisma config.`);
  }

  return value;
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: readRequiredEnv('DATABASE_URL'),
  },
});
