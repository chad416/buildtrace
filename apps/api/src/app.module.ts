import { Module } from '@nestjs/common';

import { DocumentRecordsController } from './document-records.controller.js';
import { HealthController } from './health.controller.js';
import { MachineRecordsController } from './machine-records.controller.js';

@Module({
  controllers: [HealthController, MachineRecordsController, DocumentRecordsController],
})
export class AppModule {}
