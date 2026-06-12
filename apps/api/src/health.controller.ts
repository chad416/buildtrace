import { Controller, Get } from '@nestjs/common';

type HealthResponse = {
  readonly service: 'buildtrace-api';
  readonly status: 'ok';
  readonly phase: 'phase-3-machine-records-api-foundation';
};

@Controller()
export class HealthController {
  @Get('health')
  getHealth(): HealthResponse {
    return {
      service: 'buildtrace-api',
      status: 'ok',
      phase: 'phase-3-machine-records-api-foundation',
    };
  }
}
