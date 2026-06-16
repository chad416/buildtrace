export { createActivityLog } from './activity-log';
export { createPrismaClient } from './client';
export {
  applyDocumentClassificationSuggestion,
  confirmDocumentClassificationSuggestion,
  createDocumentRecord,
  getDocumentByMachine,
  listDocumentsByMachine,
  markDocumentDownloadUrlIssued,
  updateDocumentCategory,
  updateDocumentVisibility,
} from './document-records';
export { MachineStatus, PrismaClient } from './generated/prisma/client';
export {
  createCustomer,
  createMachine,
  createMachineModel,
  getCustomerByOrganization,
  getMachineByOrganization,
  getMachineModelByOrganization,
  listCustomersByOrganization,
  listMachineModelsByOrganization,
  listMachinesByOrganization,
  updateMachine,
} from './machine-records';
export type { ActivityLogRecord } from './activity-log';
export type {
  ApplyDocumentClassificationSuggestionInput,
  ConfirmDocumentClassificationSuggestionInput,
  CreateDocumentRecordInput,
  DocumentRecord,
  DocumentRecordsDatabase,
  GetDocumentByMachineInput,
  ListDocumentsByMachineInput,
  MarkDocumentDownloadUrlIssuedInput,
  UpdateDocumentCategoryInput,
  UpdateDocumentVisibilityInput,
} from './document-records';
export type { OrganizationRole } from './generated/prisma/enums';
export type { CustomerRecord, MachineModelRecord, MachineRecord } from './machine-records';

export const dbPackageStatus = 'phase-4-document-record-helpers-ready';
