import { Module } from '@nestjs/common';

import { CustomerHandoverExportController } from './customer-handover-export.controller.js';
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
    CustomerHandoverExportController,
  ],
})
export class AppModule {}
