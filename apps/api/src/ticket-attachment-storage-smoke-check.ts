import type { DocumentStorageAdapter, DocumentStorageConfig } from './document-storage.js';
import {
  buildTicketAttachmentStoragePath,
  createTicketAttachmentSignedUrl,
  uploadTicketAttachment,
} from './ticket-attachment-storage.js';

const config: DocumentStorageConfig = {
  supabaseUrl: 'https://supabase.test',
  serviceRoleKey: 'service-role-key',
  bucketName: 'documents-private',
  signedUrlTtlSeconds: 300,
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

const storagePath = buildTicketAttachmentStoragePath({
  organizationId: ' org-1 ',
  ticketId: ' ticket-1 ',
  fileName: ' diagnostic report.pdf ',
});

assert(
  storagePath === 'organizations/org-1/tickets/ticket-1/attachments/diagnostic report.pdf',
  'Ticket attachment storage path was wrong.',
);

const uploadCalls: Array<{
  readonly bucketName: string;
  readonly path: string;
  readonly contentType: string;
  readonly upsert: boolean;
}> = [];
const signedUrlCalls: Array<{
  readonly bucketName: string;
  readonly path: string;
  readonly expiresInSeconds: number;
}> = [];

const storage: DocumentStorageAdapter = {
  from(bucketName) {
    return {
      async upload(path, _fileBody, options) {
        uploadCalls.push({
          bucketName,
          path,
          contentType: options.contentType,
          upsert: options.upsert,
        });
        return {
          data: { path },
          error: null,
        };
      },
      async createSignedUrl(path, expiresInSeconds) {
        signedUrlCalls.push({
          bucketName,
          path,
          expiresInSeconds,
        });
        return {
          data: { signedUrl: 'https://storage.test/signed-ticket-attachment' },
          error: null,
        };
      },
      async remove() {
        return {
          data: [],
          error: null,
        };
      },
    };
  },
};

const uploadResult = await uploadTicketAttachment({
  config,
  storage,
  organizationId: 'org-1',
  ticketId: 'ticket-1',
  fileName: 'diagnostic report.pdf',
  fileBody: new Uint8Array([1, 2, 3]).buffer,
});

assert(uploadResult.storagePath === storagePath, 'Uploaded attachment storage path was wrong.');
assert(uploadCalls.length === 1, 'Attachment upload was not called once.');
assert(uploadCalls[0]?.bucketName === config.bucketName, 'Attachment bucket name was wrong.');
assert(
  uploadCalls[0]?.contentType === 'application/octet-stream',
  'Attachment MIME type was wrong.',
);
assert(uploadCalls[0]?.upsert === false, 'Attachment upload must not upsert.');

const signedUrlResult = await createTicketAttachmentSignedUrl({
  config,
  storage,
  organizationId: 'org-1',
  ticketId: 'ticket-1',
  storagePath,
});

assert(
  signedUrlResult.signedUrl === 'https://storage.test/signed-ticket-attachment',
  'Attachment signed URL was wrong.',
);
assert(signedUrlResult.expiresInSeconds === 300, 'Attachment signed URL expiry was wrong.');
assert(signedUrlCalls.length === 1, 'Attachment signed URL was not called once.');
assert(signedUrlCalls[0]?.expiresInSeconds === 300, 'Storage adapter received the wrong TTL.');

await expectThrows('cross-ticket attachment path', () =>
  createTicketAttachmentSignedUrl({
    config,
    storage,
    organizationId: 'org-1',
    ticketId: 'ticket-2',
    storagePath,
  }),
);

console.info('Ticket attachment storage smoke check passed.');
