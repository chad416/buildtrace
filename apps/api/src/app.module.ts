import { Module } from '@nestjs/common';

import { HealthController } from './health.controller.js';
import { MachineRecordsController } from './machine-records.controller.js';

@Module({
  controllers: [HealthController, MachineRecordsController],
})
export class AppModule {}
