import {
  createSoftwareVersion,
  getSoftwareVersion,
  listSoftwareVersions,
  markAsCurrentKnownVersion,
  markAsDeliveredVersion,
} from './software-version-records';
import type { SoftwareVersionRecordsDatabase } from './software-version-records';
import type { SoftwareType } from '@buildtrace/shared';

function createMockDb(): SoftwareVersionRecordsDatabase {
  return {
    softwareVersion: {
      create: async (args: any) => ({ id: 'mock-id-1', ...args.data }),
      findMany: async (args: any) => [
        { id: 'mock-id-1', versionName: 'v1.0.0', softwareType: 'plc' },
      ],
      findFirst: async (args: any) => {
        if (args.where.id === 'mock-id-1') {
          return {
            id: 'mock-id-1',
            organizationId: args.where.organizationId,
            machineId: args.where.machineId,
          };
        }
        return null;
      },
      update: async (args: any) => ({ id: args.where.id, ...args.data }),
    },
  } as unknown as SoftwareVersionRecordsDatabase;
}

async function runSoftwareVersionRecordsSmokeCheck() {
  console.log('Running software-version-records smoke check...');

  const db = createMockDb();
  const organizationId = 'org-1';
  const machineId = 'machine-1';

  const created = await createSoftwareVersion({
    db,
    organizationId,
    machineId,
    versionName: 'v1.0.0',
    softwareType: 'plc' as SoftwareType,
  });
  if (!created || created.id !== 'mock-id-1') throw new Error('create failed');

  const list = await listSoftwareVersions({ db, organizationId, machineId });
  if (list.length !== 1) throw new Error('list failed');

  const get = await getSoftwareVersion({ db, organizationId, versionId: 'mock-id-1' });
  if (!get || get.id !== 'mock-id-1') throw new Error('get failed');

  const markedCurrent = await markAsCurrentKnownVersion({
    db,
    organizationId,
    machineId,
    versionId: 'mock-id-1',
  });
  if (!markedCurrent.isCurrentKnownVersion) throw new Error('mark current failed');

  const markedDelivered = await markAsDeliveredVersion({
    db,
    organizationId,
    machineId,
    versionId: 'mock-id-1',
  });
  if (!markedDelivered.isDeliveredVersion) throw new Error('mark delivered failed');

  console.log('Software version records smoke check passed.');
}

runSoftwareVersionRecordsSmokeCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
