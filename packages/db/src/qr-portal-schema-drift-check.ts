import 'dotenv/config';

import { createPrismaClient } from './client.js';

const requiredMachineColumns = [
  'qr_token',
  'qr_pin_enabled',
  'qr_pin_hash',
  'portal_default_locale',
] as const;

async function runQrPortalSchemaDriftCheck(): Promise<void> {
  const db = createPrismaClient();

  try {
    const rows = await db.$queryRaw<Array<{ readonly column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'machines'
        AND column_name IN (
          'qr_token',
          'qr_pin_enabled',
          'qr_pin_hash',
          'portal_default_locale'
        )
    `;

    const foundColumns = new Set(rows.map((row) => row.column_name));
    const missingColumns = requiredMachineColumns.filter(
      (columnName) => !foundColumns.has(columnName),
    );

    if (missingColumns.length > 0) {
      throw new Error(
        'QR portal schema drift detected. Missing machines columns: ' +
          missingColumns.join(', ') +
          '.',
      );
    }
  } finally {
    await db.$disconnect();
  }
}

await runQrPortalSchemaDriftCheck();

console.info('QR portal schema drift check passed.');
