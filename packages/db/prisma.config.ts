import { config as loadDotenv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'prisma/config';

const packageDirectory = dirname(fileURLToPath(import.meta.url));

loadDotenv();
loadDotenv({
  path: resolve(packageDirectory, '../../.env'),
  override: false,
});

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
