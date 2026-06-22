import type {
  DocumentStorageAdapter,
  DocumentStorageConfig,
  DocumentStorageSignedUrlResult,
} from './document-storage.js';

export type BuildTicketAttachmentStoragePathInput = {
  readonly organizationId: string;
  readonly ticketId: string;
  readonly fileName: string;
};

export type UploadTicketAttachmentInput = BuildTicketAttachmentStoragePathInput & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
  readonly fileBody: ArrayBuffer;
};

export type CreateTicketAttachmentSignedUrlInput = {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
  readonly organizationId: string;
  readonly ticketId: string;
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
    throw new Error(`${fieldName} is required for a ticket attachment storage path.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required for a ticket attachment storage path.`);
  }

  if (
    normalizedValue === '.' ||
    normalizedValue === '..' ||
    normalizedValue.includes('/') ||
    normalizedValue.includes('\\') ||
    containsUnsafeControlCharacter(normalizedValue)
  ) {
    throw new Error(`${fieldName} is not a safe ticket attachment storage path segment.`);
  }

  return normalizedValue;
}

function normalizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') {
    throw new Error('fileName is required for a ticket attachment storage path.');
  }

  const normalizedFileName = fileName.trim().replace(/\s+/g, ' ');

  if (!normalizedFileName) {
    throw new Error('fileName is required for a ticket attachment storage path.');
  }

  if (
    normalizedFileName === '.' ||
    normalizedFileName === '..' ||
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\') ||
    containsUnsafeControlCharacter(normalizedFileName)
  ) {
    throw new Error('fileName is not safe for a ticket attachment storage path.');
  }

  return normalizedFileName;
}

function assertTicketAttachmentStoragePathMatchesScope({
  organizationId,
  ticketId,
  storagePath,
}: {
  readonly organizationId: string;
  readonly ticketId: string;
  readonly storagePath: string;
}): void {
  const normalizedOrganizationId = normalizePathSegment(organizationId, 'organizationId');
  const normalizedTicketId = normalizePathSegment(ticketId, 'ticketId');
  const normalizedStoragePath = storagePath.trim();
  const requiredPrefix = `organizations/${normalizedOrganizationId}/tickets/${normalizedTicketId}/attachments/`;

  if (!normalizedStoragePath.startsWith(requiredPrefix)) {
    throw new Error(
      'Ticket attachment storage path does not match the authenticated organization and ticket.',
    );
  }
}

export function buildTicketAttachmentStoragePath({
  organizationId,
  ticketId,
  fileName,
}: BuildTicketAttachmentStoragePathInput): string {
  const normalizedOrganizationId = normalizePathSegment(organizationId, 'organizationId');
  const normalizedTicketId = normalizePathSegment(ticketId, 'ticketId');
  const normalizedFileName = normalizeFileName(fileName);

  return [
    'organizations',
    normalizedOrganizationId,
    'tickets',
    normalizedTicketId,
    'attachments',
    normalizedFileName,
  ].join('/');
}

export async function uploadTicketAttachment({
  config,
  storage,
  organizationId,
  ticketId,
  fileName,
  fileBody,
}: UploadTicketAttachmentInput): Promise<{ storagePath: string }> {
  const storagePath = buildTicketAttachmentStoragePath({
    organizationId,
    ticketId,
    fileName,
  });

  if (fileBody.byteLength === 0) {
    throw new Error('Ticket attachment must not be empty.');
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
    throw new Error('Ticket attachment upload did not return a storage path.');
  }

  if (uploadedStoragePath !== storagePath) {
    throw new Error('Ticket attachment upload returned an unexpected storage path.');
  }

  return {
    storagePath: uploadedStoragePath,
  };
}

export async function createTicketAttachmentSignedUrl({
  config,
  storage,
  organizationId,
  ticketId,
  storagePath,
}: CreateTicketAttachmentSignedUrlInput): Promise<DocumentStorageSignedUrlResult> {
  assertTicketAttachmentStoragePathMatchesScope({
    organizationId,
    ticketId,
    storagePath,
  });

  const response = await storage
    .from(config.bucketName)
    .createSignedUrl(storagePath, config.signedUrlTtlSeconds);

  if (response.error || !response.data?.signedUrl) {
    throw new Error(
      response.error?.message ?? 'Ticket attachment signed URL could not be created.',
    );
  }

  return {
    signedUrl: response.data.signedUrl,
    expiresInSeconds: config.signedUrlTtlSeconds,
  };
}
