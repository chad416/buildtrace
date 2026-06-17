import {
  documentCategories,
  documentLanguageCodes,
  documentVisibilityLevels,
  type DocumentCategory,
  type DocumentClassificationSource,
  type DocumentClassificationStatus,
  type DocumentLanguageCode,
  type DocumentVisibilityLevel,
} from '@buildtrace/shared';

export type DocumentMetadataApiModel = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly category: DocumentCategory;
  readonly suggestedCategory: DocumentCategory | null;
  readonly classificationConfidence: number | null;
  readonly classificationStatus: DocumentClassificationStatus;
  readonly classificationSource: DocumentClassificationSource | null;
  readonly visibilityLevel: DocumentVisibilityLevel;
  readonly visibleToCustomer: boolean;
  readonly language: DocumentLanguageCode;
  readonly uploadedByUserId: string | null;
  readonly uploadedAt: string;
  readonly lastDownloadUrlIssuedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type UploadedDocumentApiModel = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly fileName: string;
};

export type DocumentDownloadUrlApiModel = {
  readonly document: DocumentMetadataApiModel;
  readonly downloadUrl: string;
  readonly expiresInSeconds: number;
};

export type ListDocumentsApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
};

export type GetDocumentApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentId: string;
  readonly accessToken: string;
};

export type UploadDocumentApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
  readonly file: Blob;
  readonly fileName: string;
  readonly category: DocumentCategory;
  readonly language?: DocumentLanguageCode;
};

export type UpdateDocumentCategoryApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentId: string;
  readonly accessToken: string;
  readonly category: DocumentCategory;
};

export type UpdateDocumentVisibilityApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentId: string;
  readonly accessToken: string;
  readonly visibilityLevel: DocumentVisibilityLevel;
};

export type CreateDocumentDownloadUrlApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentId: string;
  readonly accessToken: string;
};

export type ApplyDocumentClassificationSuggestionApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentId: string;
  readonly accessToken: string;
};

export type ConfirmDocumentClassificationSuggestionApiInput =
  ApplyDocumentClassificationSuggestionApiInput;

type DocumentsResponseBody = {
  readonly documents: readonly DocumentMetadataApiModel[];
};

type DocumentResponseBody = {
  readonly document: DocumentMetadataApiModel;
};

type UploadDocumentResponseBody = {
  readonly document: UploadedDocumentApiModel;
};

type DocumentDownloadUrlResponseBody = DocumentDownloadUrlApiModel;

export type FetchInput = Parameters<typeof fetch>[0];
export type FetchInit = Parameters<typeof fetch>[1];
export type Fetcher = (input: FetchInput, init?: FetchInit) => Promise<Response>;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function normalizeDocumentCategory(category: DocumentCategory): DocumentCategory {
  const normalizedCategory = normalizeRequiredText('Document category', category);

  if (!documentCategories.includes(normalizedCategory as DocumentCategory)) {
    throw new Error(`Document category is not supported: ${normalizedCategory}`);
  }

  return normalizedCategory as DocumentCategory;
}

function normalizeDocumentLanguage(
  language: DocumentLanguageCode | undefined,
): DocumentLanguageCode | undefined {
  const normalizedLanguage = normalizeOptionalText(language);

  if (!normalizedLanguage) {
    return undefined;
  }

  if (!documentLanguageCodes.includes(normalizedLanguage as DocumentLanguageCode)) {
    throw new Error(`Document language is not supported: ${normalizedLanguage}`);
  }

  return normalizedLanguage as DocumentLanguageCode;
}

function normalizeDocumentVisibilityLevel(
  visibilityLevel: DocumentVisibilityLevel,
): DocumentVisibilityLevel {
  const normalizedVisibilityLevel = normalizeRequiredText(
    'Document visibility level',
    visibilityLevel,
  );

  if (!documentVisibilityLevels.includes(normalizedVisibilityLevel as DocumentVisibilityLevel)) {
    throw new Error(`Document visibility level is not supported: ${normalizedVisibilityLevel}`);
  }

  return normalizedVisibilityLevel as DocumentVisibilityLevel;
}

function buildApiUrl(path: string): URL {
  return new URL(path, apiBaseUrl);
}

function createAuthorizationHeader(accessToken: string): string {
  return `Bearer ${normalizeRequiredText('Access token', accessToken)}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(`API request failed with ${response.status}: ${responseText}`);
  }

  return (await response.json()) as T;
}

function buildMachineDocumentsUrl(input: {
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentId?: string;
}): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const documentId = normalizeOptionalText(input.documentId);
  const encodedMachineId = encodeURIComponent(machineId);
  const path = documentId
    ? `/document-records/machines/${encodedMachineId}/documents/${encodeURIComponent(documentId)}`
    : `/document-records/machines/${encodedMachineId}/documents`;
  const url = buildApiUrl(path);

  url.searchParams.set(
    'organizationId',
    normalizeRequiredText('Organization ID', input.organizationId),
  );

  return url;
}

export async function listDocuments(
  input: ListDocumentsApiInput,
  fetcher: Fetcher = fetch,
): Promise<readonly DocumentMetadataApiModel[]> {
  const response = await fetcher(buildMachineDocumentsUrl(input), {
    method: 'GET',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  const responseBody = await parseJsonResponse<DocumentsResponseBody>(response);

  return responseBody.documents;
}

export async function getDocument(
  input: GetDocumentApiInput,
  fetcher: Fetcher = fetch,
): Promise<DocumentMetadataApiModel> {
  const response = await fetcher(buildMachineDocumentsUrl(input), {
    method: 'GET',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  const responseBody = await parseJsonResponse<DocumentResponseBody>(response);

  return responseBody.document;
}

export async function uploadDocument(
  input: UploadDocumentApiInput,
  fetcher: Fetcher = fetch,
): Promise<UploadedDocumentApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const fileName = normalizeRequiredText('Document file name', input.fileName);
  const category = normalizeDocumentCategory(input.category);
  const language = normalizeDocumentLanguage(input.language);
  const formData = new FormData();

  formData.set('organizationId', normalizeRequiredText('Organization ID', input.organizationId));
  formData.set('category', category);

  if (language) {
    formData.set('language', language);
  }

  formData.set('file', input.file, fileName);

  const response = await fetcher(
    buildApiUrl(`/document-records/machines/${encodeURIComponent(machineId)}/documents/upload`),
    {
      method: 'POST',
      headers: {
        authorization: createAuthorizationHeader(input.accessToken),
      },
      body: formData,
    },
  );

  const responseBody = await parseJsonResponse<UploadDocumentResponseBody>(response);

  return responseBody.document;
}

export async function updateDocumentCategory(
  input: UpdateDocumentCategoryApiInput,
  fetcher: Fetcher = fetch,
): Promise<DocumentMetadataApiModel> {
  const url = buildMachineDocumentsUrl(input);
  const response = await fetcher(new URL(`${url.pathname}/category${url.search}`, url), {
    method: 'PATCH',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: normalizeRequiredText('Organization ID', input.organizationId),
      category: normalizeDocumentCategory(input.category),
    }),
  });

  const responseBody = await parseJsonResponse<DocumentResponseBody>(response);

  return responseBody.document;
}

export async function updateDocumentVisibility(
  input: UpdateDocumentVisibilityApiInput,
  fetcher: Fetcher = fetch,
): Promise<DocumentMetadataApiModel> {
  const url = buildMachineDocumentsUrl(input);
  const response = await fetcher(new URL(`${url.pathname}/visibility${url.search}`, url), {
    method: 'PATCH',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: normalizeRequiredText('Organization ID', input.organizationId),
      visibilityLevel: normalizeDocumentVisibilityLevel(input.visibilityLevel),
    }),
  });

  const responseBody = await parseJsonResponse<DocumentResponseBody>(response);

  return responseBody.document;
}

export async function applyDocumentClassificationSuggestion(
  input: ApplyDocumentClassificationSuggestionApiInput,
  fetcher: Fetcher = fetch,
): Promise<DocumentMetadataApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const documentId = normalizeRequiredText('Document ID', input.documentId);
  const response = await fetcher(
    buildApiUrl(
      `/document-records/machines/${encodeURIComponent(machineId)}/documents/${encodeURIComponent(documentId)}/classification-suggestion`,
    ),
    {
      method: 'POST',
      headers: {
        authorization: createAuthorizationHeader(input.accessToken),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: normalizeRequiredText('Organization ID', input.organizationId),
      }),
    },
  );

  const responseBody = await parseJsonResponse<DocumentResponseBody>(response);

  return responseBody.document;
}

export async function confirmDocumentClassificationSuggestion(
  input: ConfirmDocumentClassificationSuggestionApiInput,
  fetcher: Fetcher = fetch,
): Promise<DocumentMetadataApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const documentId = normalizeRequiredText('Document ID', input.documentId);
  const response = await fetcher(
    buildApiUrl(
      `/document-records/machines/${encodeURIComponent(machineId)}/documents/${encodeURIComponent(documentId)}/classification-confirmation`,
    ),
    {
      method: 'POST',
      headers: {
        authorization: createAuthorizationHeader(input.accessToken),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: normalizeRequiredText('Organization ID', input.organizationId),
      }),
    },
  );

  const responseBody = await parseJsonResponse<DocumentResponseBody>(response);

  return responseBody.document;
}
export async function createDocumentDownloadUrl(
  input: CreateDocumentDownloadUrlApiInput,
  fetcher: Fetcher = fetch,
): Promise<DocumentDownloadUrlApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const documentId = normalizeRequiredText('Document ID', input.documentId);
  const response = await fetcher(
    buildApiUrl(
      `/document-records/machines/${encodeURIComponent(machineId)}/documents/${encodeURIComponent(documentId)}/download-url`,
    ),
    {
      method: 'POST',
      headers: {
        authorization: createAuthorizationHeader(input.accessToken),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: normalizeRequiredText('Organization ID', input.organizationId),
      }),
    },
  );

  return parseJsonResponse<DocumentDownloadUrlResponseBody>(response);
}
