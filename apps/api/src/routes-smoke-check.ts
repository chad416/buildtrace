import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';

type RouteProbe = {
  readonly method: 'GET' | 'POST' | 'PATCH';
  readonly url: string;
  readonly expectedStatusCode: number;
  readonly payload?: unknown;
};

const routeProbes: readonly RouteProbe[] = [
  {
    method: 'GET',
    url: '/health',
    expectedStatusCode: 200,
  },
  {
    method: 'POST',
    url: '/machine-records/machines',
    expectedStatusCode: 400,
    payload: {},
  },
  {
    method: 'GET',
    url: '/machine-records/machines',
    expectedStatusCode: 400,
  },
  {
    method: 'GET',
    url: '/machine-records/machines/machine-1',
    expectedStatusCode: 400,
  },
  {
    method: 'GET',
    url: '/document-records/machines/machine-1/documents',
    expectedStatusCode: 400,
  },
  {
    method: 'GET',
    url: '/document-records/machines/machine-1/documents/document-1',
    expectedStatusCode: 400,
  },
  {
    method: 'POST',
    url: '/document-records/machines/machine-1/documents/upload',
    expectedStatusCode: 400,
    payload: {},
  },
  {
    method: 'POST',
    url: '/document-records/machines/machine-1/documents/document-1/download-url',
    expectedStatusCode: 400,
    payload: {},
  },
  {
    method: 'POST',
    url: '/document-records/machines/machine-1/documents/document-1/classification-suggestion',
    expectedStatusCode: 400,
    payload: {},
  },
  {
    method: 'PATCH',
    url: '/document-records/machines/machine-1/documents/document-1/category',
    expectedStatusCode: 400,
    payload: {},
  },
  {
    method: 'PATCH',
    url: '/document-records/machines/machine-1/documents/document-1/visibility',
    expectedStatusCode: 400,
    payload: {},
  },
];

function assertStatusCode(
  routeProbe: RouteProbe,
  actualStatusCode: number,
  responseBody: string,
): void {
  if (actualStatusCode === 404) {
    throw new Error(
      `Expected API route was not registered: ${routeProbe.method} ${routeProbe.url}`,
    );
  }

  if (actualStatusCode !== routeProbe.expectedStatusCode) {
    throw new Error(
      `Expected ${routeProbe.method} ${routeProbe.url} to return ${routeProbe.expectedStatusCode}, got ${actualStatusCode}. Body: ${responseBody}`,
    );
  }
}

function assertHealthResponse(responseBody: string): void {
  const parsedBody = JSON.parse(responseBody) as {
    readonly service?: unknown;
    readonly status?: unknown;
    readonly phase?: unknown;
  };

  if (
    parsedBody.service !== 'buildtrace-api' ||
    parsedBody.status !== 'ok' ||
    parsedBody.phase !== 'phase-3-machine-records-api-foundation'
  ) {
    throw new Error(`Health response did not match expected API state. Body: ${responseBody}`);
  }
}

async function runRoutesSmokeCheck(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: false,
  });

  await app.init();

  try {
    const server = app.getHttpAdapter().getInstance();

    for (const routeProbe of routeProbes) {
      const response = await server.inject({
        method: routeProbe.method,
        url: routeProbe.url,
        headers: {
          'content-type': 'application/json',
        },
        ...(routeProbe.payload ? { payload: routeProbe.payload } : {}),
      });

      assertStatusCode(routeProbe, response.statusCode, response.body);

      if (routeProbe.url === '/health') {
        assertHealthResponse(response.body);
      }
    }
  } finally {
    await app.close();
  }
}

await runRoutesSmokeCheck();

console.info('API routes smoke check passed.');
