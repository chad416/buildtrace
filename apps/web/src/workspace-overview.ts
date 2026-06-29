import { listDocuments, type DocumentMetadataApiModel } from '@/document-records-api';
import {
  listCustomers,
  listMachineModels,
  listMachineRecords,
  type CustomerRecordApiModel,
  type MachineModelRecordApiModel,
  type MachineRecordApiModel,
} from '@/machine-records-api';
import {
  readMachineRecordsSession,
  type MachineRecordsSessionMissingField,
} from '@/machine-records-session';
import { listServiceTickets, type ServiceTicketApiModel } from '@/service-tickets-api';
import { listSpareParts, type SparePartApiModel } from '@/spare-parts-api';

export type WorkspaceDocumentRecord = {
  readonly document: DocumentMetadataApiModel;
  readonly machine: MachineRecordApiModel;
};

export type WorkspaceTicketRecord = {
  readonly ticket: ServiceTicketApiModel;
  readonly machine: MachineRecordApiModel;
};

export type WorkspaceSparePartRecord = {
  readonly sparePart: SparePartApiModel;
  readonly machine: MachineRecordApiModel;
};

export type WorkspaceOverviewLoadState =
  | {
      readonly status: 'auth-required';
      readonly missingFields: readonly MachineRecordsSessionMissingField[];
    }
  | {
      readonly status: 'error';
      readonly message: string;
    }
  | {
      readonly status: 'ready';
      readonly organizationId: string;
      readonly accessToken: string;
      readonly customers: readonly CustomerRecordApiModel[];
      readonly machineModels: readonly MachineModelRecordApiModel[];
      readonly machines: readonly MachineRecordApiModel[];
      readonly documents: readonly WorkspaceDocumentRecord[];
      readonly tickets: readonly WorkspaceTicketRecord[];
      readonly spareParts: readonly WorkspaceSparePartRecord[];
    };

function formatLoadError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown workspace data error.';
}

export async function loadWorkspaceOverview(): Promise<WorkspaceOverviewLoadState> {
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    return {
      status: 'auth-required',
      missingFields: session.missingFields,
    };
  }

  try {
    const [machines, customers, machineModels] = await Promise.all([
      listMachineRecords({
        organizationId: session.organizationId,
        accessToken: session.accessToken,
      }),
      listCustomers({
        organizationId: session.organizationId,
        accessToken: session.accessToken,
      }),
      listMachineModels({
        organizationId: session.organizationId,
        accessToken: session.accessToken,
      }),
    ]);

    const perMachineRecords = await Promise.all(
      machines.map(async (machine) => {
        const [documents, ticketsResponse, sparePartsResponse] = await Promise.all([
          listDocuments({
            organizationId: session.organizationId,
            machineId: machine.id,
            accessToken: session.accessToken,
          }),
          listServiceTickets({
            organizationId: session.organizationId,
            machineId: machine.id,
            accessToken: session.accessToken,
          }),
          listSpareParts({
            organizationId: session.organizationId,
            machineId: machine.id,
            accessToken: session.accessToken,
          }),
        ]);

        return {
          machine,
          documents,
          tickets: ticketsResponse.tickets,
          spareParts: sparePartsResponse.spareParts,
        };
      }),
    );

    return {
      status: 'ready',
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      customers,
      machineModels,
      machines,
      documents: perMachineRecords.flatMap(({ machine, documents }) =>
        documents.map((document) => ({ document, machine })),
      ),
      tickets: perMachineRecords.flatMap(({ machine, tickets }) =>
        tickets.map((ticket) => ({ ticket, machine })),
      ),
      spareParts: perMachineRecords.flatMap(({ machine, spareParts }) =>
        spareParts.map((sparePart) => ({ sparePart, machine })),
      ),
    };
  } catch (error) {
    return {
      status: 'error',
      message: formatLoadError(error),
    };
  }
}

export function formatWorkspaceDate(value: string | null, locale: string): string {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(date);
}

export function formatWorkspaceCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}
