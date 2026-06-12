export { createActivityLog } from './activity-log';
export { createPrismaClient } from './client';
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
} from './machine-records';
export type { ActivityLogRecord } from './activity-log';
export type { OrganizationRole } from './generated/prisma/enums';
export type { CustomerRecord, MachineModelRecord, MachineRecord } from './machine-records';

export const dbPackageStatus = 'phase-3-machine-record-helpers-ready';
