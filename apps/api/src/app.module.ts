import { Module } from '@nestjs/common';

import { CustomerHandoverExportController } from './customer-handover-export.controller.js';
import { DocumentRecordsController } from './document-records.controller.js';
import { HandoverCompletenessController } from './handover-completeness.controller.js';
import { HealthController } from './health.controller.js';
import { MachineRecordsController } from './machine-records.controller.js';
import { QuoteRequestsController } from './quote-requests.controller.js';
import { QrPortalController } from './qr-portal.controller.js';
import { ServiceTicketsController } from './service-tickets.controller.js';
import { SoftwareVersionsController } from './software-versions.controller.js';
import { SparePartsController } from './spare-parts.controller.js';

@Module({
  controllers: [
    HealthController,
    MachineRecordsController,
    DocumentRecordsController,
    HandoverCompletenessController,
    CustomerHandoverExportController,
    QuoteRequestsController,
    QrPortalController,
    ServiceTicketsController,
    SoftwareVersionsController,
    SparePartsController,
  ],
})
export class AppModule {}
