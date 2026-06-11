import { MachineStatus } from '@buildtrace/db';
import { machineStatuses } from '@buildtrace/shared';

function sortValues(values: readonly string[]): readonly string[] {
  return [...values].sort();
}

function assertSameValues(
  leftName: string,
  left: readonly string[],
  rightName: string,
  right: readonly string[],
): void {
  const sortedLeft = sortValues(left);
  const sortedRight = sortValues(right);

  if (sortedLeft.length !== sortedRight.length) {
    throw new Error(
      `Machine status drift detected: ${leftName} has ${sortedLeft.length} values, ${rightName} has ${sortedRight.length} values.`,
    );
  }

  const mismatch = sortedLeft.find((value, index) => value !== sortedRight[index]);

  if (mismatch) {
    throw new Error(
      `Machine status drift detected. ${leftName}: ${sortedLeft.join(', ')}. ${rightName}: ${sortedRight.join(', ')}.`,
    );
  }
}

assertSameValues(
  'Prisma MachineStatus',
  Object.values(MachineStatus),
  'shared machineStatuses',
  machineStatuses,
);

console.info('Machine status drift check passed.');
