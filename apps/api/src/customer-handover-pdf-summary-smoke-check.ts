import { documentLabels, handoverCompletenessCopy } from '@buildtrace/i18n';

import {
  buildCustomerHandoverPdfSummary,
  type CustomerHandoverPdfPlaywrightLauncher,
} from './customer-handover-pdf-summary.js';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const mockLauncher: CustomerHandoverPdfPlaywrightLauncher = {
  async launch() {
    return {
      async newPage() {
        return {
          async setContent() {},
          async pdf() {
            return Buffer.from('PDF');
          },
          async close() {},
        };
      },
      async close() {},
    };
  },
};

const pdf = await buildCustomerHandoverPdfSummary(
  {
    machineName: 'Assembly Cell 7',
    serialNumber: 'BT-2026-007',
    locale: 'en',
    completeness: {
      checklistVersion: 'customer-handover-beta-v1',
      requiredCategories: ['manuals', 'safety-instructions', 'spare-parts-bom', 'certificates'],
      presentCategories: ['manuals', 'safety-instructions'],
      missingCategories: ['spare-parts-bom', 'certificates'],
      completedCount: 2,
      requiredCount: 4,
      percentage: 50,
    },
    documents: [
      {
        fileName: 'Machine manual.pdf',
        category: 'manuals',
        visibilityLevel: 'customer-visible',
      },
      {
        fileName: 'Safety instructions.pdf',
        category: 'safety-instructions',
        visibilityLevel: 'customer-visible',
      },
    ],
    exportId: 'export-1',
    createdAt: new Date('2026-06-20T12:00:00.000Z'),
    sensitiveCategories: [],
    labels: documentLabels.en,
    copy: handoverCompletenessCopy.en,
  },
  mockLauncher,
);

assert(pdf instanceof ArrayBuffer, 'PDF summary must return an ArrayBuffer.');
assert(pdf.byteLength > 0, 'PDF summary must not be empty.');

console.info('Customer handover PDF summary smoke check passed.');
