import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

const port = Number(process.env.API_PORT ?? 4000);

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.getHttpAdapter().get('/health', () => ({
    service: 'buildtrace-api',
    status: 'ok',
    phase: 'phase-2-trust-foundation',
  }));

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
