import {
  assertDocumentStoragePathMatchesTenant,
  buildDocumentStoragePath,
  createSignedDocumentDownloadUrl,
  readDocumentStorageConfig,
  type DocumentStorageAdapter,
} from './document-storage.js';

type CapturedStorageCall = {
  readonly bucketName: string;
  readonly storagePath: string;
  readonly expiresInSeconds: number;
};

const validEnv = {
  SUPABASE_URL: 'https://buildtrace.test',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  DOCUMENT_STORAGE_BUCKET: 'buildtrace-documents',
  SIGNED_URL_TTL_SECONDS: '900',
};

function expectThrow(description: string, action: () => unknown): void {
  try {
    action();
  } catch {
    return;
  }

  throw new Error(`${description} did not throw.`);
}

async function expectAsyncThrow(
  description: string,
  action: () => Promise<unknown>,
): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${description} did not throw.`);
}

function createCapturedStorageAdapter(calls: CapturedStorageCall[]): DocumentStorageAdapter {
  return {
    from(bucketName) {
      return {
        async createSignedUrl(storagePath, expiresInSeconds) {
          calls.push({
            bucketName,
            storagePath,
            expiresInSeconds,
          });

          return {
            data: {
              signedUrl: `https://signed.buildtrace.test/${encodeURIComponent(storagePath)}?token=signed`,
            },
            error: null,
          };
        },
      };
    },
  };
}

function createFailingStorageAdapter(): DocumentStorageAdapter {
  return {
    from() {
      return {
        async createSignedUrl() {
          return {
            data: null,
            error: {
              message: 'storage refused signed url',
            },
          };
        },
      };
    },
  };
}

function runConfigSmokeCheck(): void {
  const config = readDocumentStorageConfig(validEnv);

  if (
    config.supabaseUrl !== validEnv.SUPABASE_URL ||
    config.serviceRoleKey !== validEnv.SUPABASE_SERVICE_ROLE_KEY ||
    config.bucketName !== validEnv.DOCUMENT_STORAGE_BUCKET ||
    config.signedUrlTtlSeconds !== 900
  ) {
    throw new Error('Document storage config did not normalize expected values.');
  }

  expectThrow('public document bucket rejection', () =>
    readDocumentStorageConfig({
      ...validEnv,
      DOCUMENT_STORAGE_BUCKET: 'public',
    }),
  );

  expectThrow('missing storage bucket rejection', () =>
    readDocumentStorageConfig({
      ...validEnv,
      DOCUMENT_STORAGE_BUCKET: '',
    }),
  );

  expectThrow('invalid signed URL TTL rejection', () =>
    readDocumentStorageConfig({
      ...validEnv,
      SIGNED_URL_TTL_SECONDS: '0',
    }),
  );
}

function runStoragePathSmokeCheck(): string {
  const storagePath = buildDocumentStoragePath({
    organizationId: 'organization-1',
    machineId: 'machine-1',
    documentId: 'document-1',
    fileName: 'PLC backup.zip',
  });

  if (
    storagePath !==
    'organizations/organization-1/machines/machine-1/documents/document-1/PLC backup.zip'
  ) {
    throw new Error(`Unexpected document storage path: ${storagePath}`);
  }

  assertDocumentStoragePathMatchesTenant({
    organizationId: 'organization-1',
    machineId: 'machine-1',
    storagePath,
  });

  expectThrow('cross-tenant storage path rejection', () =>
    assertDocumentStoragePathMatchesTenant({
      organizationId: 'organization-2',
      machineId: 'machine-1',
      storagePath,
    }),
  );

  expectThrow('cross-machine storage path rejection', () =>
    assertDocumentStoragePathMatchesTenant({
      organizationId: 'organization-1',
      machineId: 'machine-2',
      storagePath,
    }),
  );

  expectThrow('path traversal organization rejection', () =>
    buildDocumentStoragePath({
      organizationId: '../organization-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      fileName: 'manual.pdf',
    }),
  );

  expectThrow('path traversal file name rejection', () =>
    buildDocumentStoragePath({
      organizationId: 'organization-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      fileName: '../manual.pdf',
    }),
  );

  return storagePath;
}

async function runSignedUrlSmokeCheck(storagePath: string): Promise<void> {
  const calls: CapturedStorageCall[] = [];
  const config = readDocumentStorageConfig(validEnv);

  const result = await createSignedDocumentDownloadUrl({
    config,
    storage: createCapturedStorageAdapter(calls),
    organizationId: 'organization-1',
    machineId: 'machine-1',
    storagePath,
  });

  if (result.expiresInSeconds !== 900 || !result.signedUrl.includes('token=signed')) {
    throw new Error('Signed document URL result did not include the expected TTL and token.');
  }

  const [call] = calls;

  if (!call) {
    throw new Error('Signed document URL did not call the storage adapter.');
  }

  if (
    call.bucketName !== 'buildtrace-documents' ||
    call.storagePath !== storagePath ||
    call.expiresInSeconds !== 900
  ) {
    throw new Error('Signed document URL did not use the expected private bucket/path/TTL.');
  }

  await expectAsyncThrow('cross-tenant signed URL rejection', () =>
    createSignedDocumentDownloadUrl({
      config,
      storage: createCapturedStorageAdapter([]),
      organizationId: 'organization-2',
      machineId: 'machine-1',
      storagePath,
    }),
  );

  await expectAsyncThrow('storage signed URL failure propagation', () =>
    createSignedDocumentDownloadUrl({
      config,
      storage: createFailingStorageAdapter(),
      organizationId: 'organization-1',
      machineId: 'machine-1',
      storagePath,
    }),
  );
}

async function runDocumentStorageSmokeCheck(): Promise<void> {
  runConfigSmokeCheck();
  const storagePath = runStoragePathSmokeCheck();
  await runSignedUrlSmokeCheck(storagePath);
}

await runDocumentStorageSmokeCheck();

console.info('Document storage smoke check passed.');
