import { buildSoftwareVersionStoragePath } from './software-version-storage.js';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function expectThrows(name: string, action: () => unknown): void {
  try {
    action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

const storagePath = buildSoftwareVersionStoragePath({
  organizationId: ' org-1 ',
  machineId: ' machine-1 ',
  versionId: ' version-1 ',
  fileName: ' PLC backup.zip ',
});

assert(
  storagePath ===
    'organizations/org-1/machines/machine-1/software-versions/version-1/PLC backup.zip',
  'Software version storage path was wrong.',
);

expectThrows('missing organization ID', () =>
  buildSoftwareVersionStoragePath({
    organizationId: ' ',
    machineId: 'machine-1',
    versionId: 'version-1',
    fileName: 'PLC backup.zip',
  }),
);

expectThrows('unsafe machine ID', () =>
  buildSoftwareVersionStoragePath({
    organizationId: 'org-1',
    machineId: '../machine-1',
    versionId: 'version-1',
    fileName: 'PLC backup.zip',
  }),
);

expectThrows('unsafe version ID', () =>
  buildSoftwareVersionStoragePath({
    organizationId: 'org-1',
    machineId: 'machine-1',
    versionId: 'version/1',
    fileName: 'PLC backup.zip',
  }),
);

expectThrows('unsafe file name', () =>
  buildSoftwareVersionStoragePath({
    organizationId: 'org-1',
    machineId: 'machine-1',
    versionId: 'version-1',
    fileName: '../PLC backup.zip',
  }),
);

console.info('Software version storage smoke check passed.');
