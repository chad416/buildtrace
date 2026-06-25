import type {
  DocumentStorageAdapter,
  DocumentStorageConfig,
  DocumentStorageSignedUrlResult,
} from './document-storage.js';

export type BuildSoftwareVersionStoragePathInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly versionId: string;
  readonly fileName: string;
};

export type UploadSoftwareVersionFileInput = BuildSoftwareVersionStoragePathInput & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
  readonly fileBody: ArrayBuffer;
};

export type CreateSoftwareVersionFileSignedUrlInput = {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
  readonly organizationId: string;
  readonly machineId: string;
  readonly storagePath: string;
};

function containsUnsafeControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const characterCode = character.charCodeAt(0);

    return characterCode <= 31 || characterCode === 127;
  });
}

function normalizePathSegment(value: string, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} is required for a software version storage path.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required for a software version storage path.`);
  }

  if (
    normalizedValue === '.' ||
    normalizedValue === '..' ||
    normalizedValue.includes('/') ||
    normalizedValue.includes('\\') ||
    containsUnsafeControlCharacter(normalizedValue)
  ) {
    throw new Error(`${fieldName} is not a safe software version storage path segment.`);
  }

  return normalizedValue;
}

function normalizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') {
    throw new Error('fileName is required for a software version storage path.');
  }

  const normalizedFileName = fileName.trim().replace(/\s+/g, ' ');

  if (!normalizedFileName) {
    throw new Error('fileName is required for a software version storage path.');
  }

  if (
    normalizedFileName === '.' ||
    normalizedFileName === '..' ||
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\') ||
    containsUnsafeControlCharacter(normalizedFileName)
  ) {
    throw new Error('fileName is not safe for a software version storage path.');
  }

  return normalizedFileName;
}

function assertSoftwareVersionStoragePathMatchesScope({
  organizationId,
  machineId,
  storagePath,
}: {
  readonly organizationId: string;
  readonly machineId: string;
  readonly storagePath: string;
}): void {
  const normalizedOrganizationId = normalizePathSegment(organizationId, 'organizationId');
  const normalizedMachineId = normalizePathSegment(machineId, 'machineId');
  const normalizedStoragePath = storagePath.trim();
  const requiredPrefix = `organizations/${normalizedOrganizationId}/machines/${normalizedMachineId}/software-versions/`;

  if (!normalizedStoragePath.startsWith(requiredPrefix)) {
    throw new Error(
      'Software version storage path does not match the authenticated organization and machine.',
    );
  }
}

export function buildSoftwareVersionStoragePath({
  organizationId,
  machineId,
  versionId,
  fileName,
}: BuildSoftwareVersionStoragePathInput): string {
  const normalizedOrganizationId = normalizePathSegment(organizationId, 'organizationId');
  const normalizedMachineId = normalizePathSegment(machineId, 'machineId');
  const normalizedVersionId = normalizePathSegment(versionId, 'versionId');
  const normalizedFileName = normalizeFileName(fileName);

  return [
    'organizations',
    normalizedOrganizationId,
    'machines',
    normalizedMachineId,
    'software-versions',
    normalizedVersionId,
    normalizedFileName,
  ].join('/');
}

export async function uploadSoftwareVersionFile({
  config,
  storage,
  organizationId,
  machineId,
  versionId,
  fileName,
  fileBody,
}: UploadSoftwareVersionFileInput): Promise<{ storagePath: string }> {
  const storagePath = buildSoftwareVersionStoragePath({
    organizationId,
    machineId,
    versionId,
    fileName,
  });

  if (fileBody.byteLength === 0) {
    throw new Error('Software version file must not be empty.');
  }

  const response = await storage.from(config.bucketName).upload(storagePath, fileBody, {
    contentType: 'application/octet-stream',
    upsert: false,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  const uploadedStoragePath = response.data?.path?.trim();

  if (!uploadedStoragePath) {
    throw new Error('Software version file upload did not return a storage path.');
  }

  if (uploadedStoragePath !== storagePath) {
    throw new Error('Software version file upload returned an unexpected storage path.');
  }

  return {
    storagePath: uploadedStoragePath,
  };
}

export async function createSoftwareVersionFileSignedUrl({
  config,
  storage,
  organizationId,
  machineId,
  storagePath,
}: CreateSoftwareVersionFileSignedUrlInput): Promise<DocumentStorageSignedUrlResult> {
  assertSoftwareVersionStoragePathMatchesScope({
    organizationId,
    machineId,
    storagePath,
  });

  const response = await storage
    .from(config.bucketName)
    .createSignedUrl(storagePath, config.signedUrlTtlSeconds);

  if (response.error || !response.data?.signedUrl) {
    throw new Error(
      response.error?.message ?? 'Software version file signed URL could not be created.',
    );
  }

  return {
    signedUrl: response.data.signedUrl,
    expiresInSeconds: config.signedUrlTtlSeconds,
  };
}
