import { Module } from '@nestjs/common';

import { DocumentRecordsController } from './document-records.controller.js';
import { HandoverCompletenessController } from './handover-completeness.controller.js';
import { HealthController } from './health.controller.js';
import { MachineRecordsController } from './machine-records.controller.js';

@Module({
  controllers: [
    HealthController,
    MachineRecordsController,
    DocumentRecordsController,
    HandoverCompletenessController,
  ],
})
export class AppModule {}
