import { createClient } from '@supabase/supabase-js';

type Environment = Record<string, string | undefined>;

export type DocumentStorageConfig = {
  readonly supabaseUrl: string;
  readonly serviceRoleKey: string;
  readonly bucketName: string;
  readonly signedUrlTtlSeconds: number;
};

export type BuildDocumentStoragePathInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentId: string;
  readonly fileName: string;
};

export type DocumentStorageTenantScopeInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly storagePath: string;
};

export type DocumentStorageSignedUrlResult = {
  readonly signedUrl: string;
  readonly expiresInSeconds: number;
};

export type DocumentStorageUploadResult = {
  readonly storagePath: string;
};

type SignedUrlResponse = {
  readonly data: {
    readonly signedUrl: string;
  } | null;
  readonly error: {
    readonly message: string;
  } | null;
};

type UploadResponse = {
  readonly data: {
    readonly path: string;
  } | null;
  readonly error: {
    readonly message: string;
  } | null;
};

type RemoveResponse = {
  readonly data: unknown[] | null;
  readonly error: {
    readonly message: string;
  } | null;
};

export type DocumentStorageBucketClient = {
  readonly createSignedUrl: (
    storagePath: string,
    expiresInSeconds: number,
  ) => Promise<SignedUrlResponse>;
  readonly upload: (
    storagePath: string,
    fileBody: ArrayBuffer,
    options: {
      readonly contentType: string;
      readonly upsert: false;
    },
  ) => Promise<UploadResponse>;
  readonly remove: (storagePaths: readonly string[]) => Promise<RemoveResponse>;
};

export type DocumentStorageAdapter = {
  readonly from: (bucketName: string) => DocumentStorageBucketClient;
};

export type CreateSignedDocumentDownloadUrlInput = DocumentStorageTenantScopeInput & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
};

export type UploadDocumentToStorageInput = DocumentStorageTenantScopeInput & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
  readonly fileBody: ArrayBuffer;
  readonly fileType: string;
};

export type RemoveDocumentFromStorageInput = DocumentStorageTenantScopeInput & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
};

const MIN_SIGNED_URL_TTL_SECONDS = 60;
const MAX_SIGNED_URL_TTL_SECONDS = 3600;
const DOCUMENT_BUCKET_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/;

function requireNonEmptyEnv(env: Environment, name: string): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for the document storage boundary.`);
  }

  return value;
}

function readSignedUrlTtlSeconds(env: Environment): number {
  const rawValue = requireNonEmptyEnv(env, 'SIGNED_URL_TTL_SECONDS');
  const ttlSeconds = Number(rawValue);

  if (!Number.isInteger(ttlSeconds)) {
    throw new Error('SIGNED_URL_TTL_SECONDS must be an integer number of seconds.');
  }

  if (ttlSeconds < MIN_SIGNED_URL_TTL_SECONDS || ttlSeconds > MAX_SIGNED_URL_TTL_SECONDS) {
    throw new Error(
      `SIGNED_URL_TTL_SECONDS must be between ${MIN_SIGNED_URL_TTL_SECONDS} and ${MAX_SIGNED_URL_TTL_SECONDS}.`,
    );
  }

  return ttlSeconds;
}

function containsUnsafeControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const characterCode = character.charCodeAt(0);

    return characterCode <= 31 || characterCode === 127;
  });
}
function normalizePrivateBucketName(bucketName: string): string {
  const normalizedBucketName = bucketName.trim();

  if (!DOCUMENT_BUCKET_NAME_PATTERN.test(normalizedBucketName)) {
    throw new Error(
      'DOCUMENT_STORAGE_BUCKET must be a lowercase private bucket name using letters, numbers, dots, dashes, or underscores.',
    );
  }

  if (normalizedBucketName === 'public') {
    throw new Error('DOCUMENT_STORAGE_BUCKET must not be the public bucket.');
  }

  return normalizedBucketName;
}

function normalizePathSegment(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required for a document storage path.`);
  }

  if (
    normalizedValue === '.' ||
    normalizedValue === '..' ||
    normalizedValue.includes('/') ||
    normalizedValue.includes('\\') ||
    containsUnsafeControlCharacter(normalizedValue)
  ) {
    throw new Error(`${fieldName} is not a safe document storage path segment.`);
  }

  return normalizedValue;
}

function normalizeFileName(fileName: string): string {
  const normalizedFileName = fileName.trim().replace(/\s+/g, ' ');

  if (!normalizedFileName) {
    throw new Error('fileName is required for a document storage path.');
  }

  if (
    normalizedFileName === '.' ||
    normalizedFileName === '..' ||
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\') ||
    containsUnsafeControlCharacter(normalizedFileName)
  ) {
    throw new Error('fileName is not safe for a document storage path.');
  }

  return normalizedFileName;
}

export function readDocumentStorageConfig(env: Environment = process.env): DocumentStorageConfig {
  return {
    supabaseUrl: requireNonEmptyEnv(env, 'SUPABASE_URL'),
    serviceRoleKey: requireNonEmptyEnv(env, 'SUPABASE_SERVICE_ROLE_KEY'),
    bucketName: normalizePrivateBucketName(requireNonEmptyEnv(env, 'DOCUMENT_STORAGE_BUCKET')),
    signedUrlTtlSeconds: readSignedUrlTtlSeconds(env),
  };
}

export function buildDocumentStoragePath({
  organizationId,
  machineId,
  documentId,
  fileName,
}: BuildDocumentStoragePathInput): string {
  const normalizedOrganizationId = normalizePathSegment(organizationId, 'organizationId');
  const normalizedMachineId = normalizePathSegment(machineId, 'machineId');
  const normalizedDocumentId = normalizePathSegment(documentId, 'documentId');
  const normalizedFileName = normalizeFileName(fileName);

  return [
    'organizations',
    normalizedOrganizationId,
    'machines',
    normalizedMachineId,
    'documents',
    normalizedDocumentId,
    normalizedFileName,
  ].join('/');
}

export function assertDocumentStoragePathMatchesTenant({
  organizationId,
  machineId,
  storagePath,
}: DocumentStorageTenantScopeInput): void {
  const normalizedOrganizationId = normalizePathSegment(organizationId, 'organizationId');
  const normalizedMachineId = normalizePathSegment(machineId, 'machineId');
  const normalizedStoragePath = storagePath.trim();
  const requiredPrefix = `organizations/${normalizedOrganizationId}/machines/${normalizedMachineId}/documents/`;

  if (!normalizedStoragePath.startsWith(requiredPrefix)) {
    throw new Error('Document storage path does not match the authenticated tenant and machine.');
  }
}

export function createSupabaseDocumentStorageAdapter(
  config: DocumentStorageConfig = readDocumentStorageConfig(),
): DocumentStorageAdapter {
  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return {
    from(bucketName) {
      const bucket = supabase.storage.from(bucketName);

      return {
        createSignedUrl(storagePath, expiresInSeconds) {
          return bucket.createSignedUrl(storagePath, expiresInSeconds);
        },
        upload(storagePath, fileBody, options) {
          return bucket.upload(storagePath, fileBody, options);
        },
        remove(storagePaths) {
          return bucket.remove([...storagePaths]);
        },
      };
    },
  };
}

export async function createSignedDocumentDownloadUrl({
  config,
  storage,
  organizationId,
  machineId,
  storagePath,
}: CreateSignedDocumentDownloadUrlInput): Promise<DocumentStorageSignedUrlResult> {
  assertDocumentStoragePathMatchesTenant({
    organizationId,
    machineId,
    storagePath,
  });

  const response = await storage
    .from(config.bucketName)
    .createSignedUrl(storagePath, config.signedUrlTtlSeconds);

  if (response.error || !response.data?.signedUrl) {
    throw new Error(response.error?.message ?? 'Document signed URL could not be created.');
  }

  return {
    signedUrl: response.data.signedUrl,
    expiresInSeconds: config.signedUrlTtlSeconds,
  };
}
export async function uploadDocumentToStorage({
  config,
  storage,
  organizationId,
  machineId,
  storagePath,
  fileBody,
  fileType,
}: UploadDocumentToStorageInput): Promise<DocumentStorageUploadResult> {
  assertDocumentStoragePathMatchesTenant({
    organizationId,
    machineId,
    storagePath,
  });

  const response = await storage.from(config.bucketName).upload(storagePath, fileBody, {
    contentType: fileType,
    upsert: false,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  const uploadedStoragePath = response.data?.path?.trim();

  if (!uploadedStoragePath) {
    throw new Error('Document upload did not return a storage path.');
  }

  if (uploadedStoragePath !== storagePath) {
    throw new Error('Document upload returned an unexpected storage path.');
  }

  return {
    storagePath: uploadedStoragePath,
  };
}

export async function removeDocumentFromStorage({
  config,
  storage,
  organizationId,
  machineId,
  storagePath,
}: RemoveDocumentFromStorageInput): Promise<void> {
  assertDocumentStoragePathMatchesTenant({
    organizationId,
    machineId,
    storagePath,
  });

  const response = await storage.from(config.bucketName).remove([storagePath]);

  if (response.error) {
    throw new Error(response.error.message);
  }
}
