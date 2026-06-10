import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client';

type CreatePrismaClientOptions = {
  readonly databaseUrl?: string;
};

function getDatabaseUrl(databaseUrl?: string): string {
  const resolvedDatabaseUrl = databaseUrl ?? process.env.DATABASE_URL;

  if (!resolvedDatabaseUrl) {
    throw new Error('DATABASE_URL is required to create a Prisma client.');
  }

  return resolvedDatabaseUrl;
}

export function createPrismaClient(options: CreatePrismaClientOptions = {}): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(options.databaseUrl),
  });

  return new PrismaClient({ adapter });
}
