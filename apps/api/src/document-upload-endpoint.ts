import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@buildtrace/db';
import {
  documentCategories,
  documentLanguageCodes,
  type DocumentCategory,
  type DocumentLanguageCode,
} from '@buildtrace/shared';

import {
  createDocumentUploadCommand,
  type DocumentUploadCommandDependencies,
} from './document-upload.js';

export const MAX_DOCUMENT_UPLOAD_BYTES = 25 * 1024 * 1024;

const allowedDocumentUploadExtensions = new Set([
  '.pdf',
  '.txt',
  '.csv',
  '.json',
  '.xml',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
  '.7z',
  '.dwg',
  '.dxf',
  '.step',
  '.stp',
  '.s7p',
  '.zap13',
  '.zap14',
  '.zap15',
  '.zap16',
  '.zap17',
  '.zap18',
  '.zap19',
  '.ap13',
  '.ap14',
  '.ap15',
  '.ap16',
  '.ap17',
  '.ap18',
  '.ap19',
  '.acd',
  '.rss',
  '.mer',
]);

const allowedDocumentUploadMimeTypes = new Set([
  'application/octet-stream',
  'application/pdf',
  'application/json',
  'application/xml',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/plain',
  'text/xml',
]);

type MultipartField = {
  readonly value?: unknown;
};

export type DocumentUploadMultipartFile = {
  readonly filename?: unknown;
  readonly mimetype?: unknown;
  readonly file?: AsyncIterable<Uint8Array>;
  readonly fields?: Record<string, unknown>;
};

export type DocumentUploadHttpRequest = {
  readonly body?: unknown;
  readonly file?: () => Promise<DocumentUploadMultipartFile | undefined>;
};

export type CreateDocumentUploadResponse = {
  readonly document: {
    readonly id: string;
    readonly organizationId: string;
    readonly machineId: string;
    readonly fileName: string;
  };
};

type CreateDocumentUploadFromMultipartRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly request: DocumentUploadHttpRequest;
  readonly dependencies: Partial<DocumentUploadCommandDependencies> & {
    readonly db: PrismaClient;
  };
};

type UploadedFileBody = {
  readonly fileBody: ArrayBuffer;
  readonly checksum: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapMultipartField(value: unknown): unknown {
  if (Array.isArray(value)) {
    throw new BadRequestException('Repeated document upload fields are not supported.');
  }

  if (isRecord(value) && 'value' in value) {
    return (value as MultipartField).value;
  }

  return value;
}

function readOptionalTextField(
  name: string,
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): string | undefined {
  const bodyValue = isRecord(body) ? unwrapMultipartField(body[name]) : undefined;
  const multipartValue = multipartFields ? unwrapMultipartField(multipartFields[name]) : undefined;
  const value = bodyValue ?? multipartValue;

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a string.`);
  }

  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function readRequiredTextField(
  name: string,
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): string {
  const value = readOptionalTextField(name, body, multipartFields);

  if (!value) {
    throw new BadRequestException(`${name} is required.`);
  }

  return value;
}

function readRequiredParam(name: string, value: string | undefined): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new BadRequestException(`${name} is required.`);
  }

  return normalizedValue;
}

function readDocumentCategoryField(
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): DocumentCategory {
  const category = readRequiredTextField('category', body, multipartFields);

  if (!documentCategories.includes(category as DocumentCategory)) {
    throw new BadRequestException(`category must be one of: ${documentCategories.join(', ')}.`);
  }

  return category as DocumentCategory;
}

function readDocumentLanguageField(
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): DocumentLanguageCode {
  const language = readOptionalTextField('language', body, multipartFields) ?? 'unknown';

  if (!documentLanguageCodes.includes(language as DocumentLanguageCode)) {
    throw new BadRequestException(`language must be one of: ${documentLanguageCodes.join(', ')}.`);
  }

  return language as DocumentLanguageCode;
}

function normalizeUploadedFileName(fileName: unknown): string {
  if (typeof fileName !== 'string') {
    throw new BadRequestException('Uploaded document file name is required.');
  }

  const normalizedFileName = fileName.trim().replace(/\s+/g, ' ');

  if (!normalizedFileName) {
    throw new BadRequestException('Uploaded document file name is required.');
  }

  if (
    normalizedFileName === '.' ||
    normalizedFileName === '..' ||
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\')
  ) {
    throw new BadRequestException('Uploaded document file name is not safe.');
  }

  return normalizedFileName;
}

function normalizeUploadedMimeType(mimeType: unknown): string {
  if (typeof mimeType !== 'string') {
    throw new BadRequestException('Uploaded document MIME type is required.');
  }

  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (!normalizedMimeType) {
    throw new BadRequestException('Uploaded document MIME type is required.');
  }

  return normalizedMimeType;
}

function readFileExtension(fileName: string): string {
  const extensionStart = fileName.lastIndexOf('.');

  if (extensionStart <= 0 || extensionStart === fileName.length - 1) {
    throw new BadRequestException('Uploaded document file extension is required.');
  }

  return fileName.slice(extensionStart).toLowerCase();
}

function assertAllowedDocumentUploadType(fileName: string, mimeType: string): void {
  const extension = readFileExtension(fileName);

  if (!allowedDocumentUploadExtensions.has(extension)) {
    throw new BadRequestException(`Uploaded document extension ${extension} is not allowed.`);
  }

  if (!allowedDocumentUploadMimeTypes.has(mimeType)) {
    throw new BadRequestException(`Uploaded document MIME type ${mimeType} is not allowed.`);
  }
}

async function readUploadedFileBody(file: DocumentUploadMultipartFile): Promise<UploadedFileBody> {
  if (!file.file) {
    throw new BadRequestException('Uploaded document file stream is required.');
  }

  const hash = createHash('sha256');
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of file.file) {
    const buffer = Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > MAX_DOCUMENT_UPLOAD_BYTES) {
      throw new BadRequestException(
        `Uploaded document must be ${MAX_DOCUMENT_UPLOAD_BYTES} bytes or smaller.`,
      );
    }

    hash.update(buffer);
    chunks.push(buffer);
  }

  if (totalBytes === 0) {
    throw new BadRequestException('Uploaded document file must not be empty.');
  }

  const body = Buffer.concat(chunks, totalBytes);

  return {
    fileBody: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    checksum: hash.digest('hex'),
  };
}

async function readUploadedMultipartFile(
  request: DocumentUploadHttpRequest,
): Promise<DocumentUploadMultipartFile> {
  if (typeof request.file !== 'function') {
    throw new BadRequestException('Uploaded document file is required.');
  }

  const file = await request.file();

  if (!file) {
    throw new BadRequestException('Uploaded document file is required.');
  }

  return file;
}

export async function createDocumentUploadFromMultipartRequest({
  authorizationHeader,
  machineId,
  request,
  dependencies,
}: CreateDocumentUploadFromMultipartRequestInput): Promise<CreateDocumentUploadResponse> {
  const normalizedMachineId = readRequiredParam('machineId', machineId);
  const uploadedFile = await readUploadedMultipartFile(request);
  const body = request.body;
  const multipartFields = uploadedFile.fields;

  const organizationId = readRequiredTextField('organizationId', body, multipartFields);
  const category = readDocumentCategoryField(body, multipartFields);
  const language = readDocumentLanguageField(body, multipartFields);
  const fileName = normalizeUploadedFileName(uploadedFile.filename);
  const fileType = normalizeUploadedMimeType(uploadedFile.mimetype);

  assertAllowedDocumentUploadType(fileName, fileType);

  const { fileBody, checksum } = await readUploadedFileBody(uploadedFile);

  const result = await createDocumentUploadCommand({
    authorizationHeader,
    organizationId,
    machineId: normalizedMachineId,
    fileName,
    fileType,
    fileBody,
    category,
    checksum,
    language,
    dependencies,
  });

  return {
    document: {
      id: result.documentId,
      organizationId: result.organizationId,
      machineId: result.machineId,
      fileName: result.fileName,
    },
  };
}
