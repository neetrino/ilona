import { Prisma } from '@ilona/database';

export function formatUserFullName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const parts = [firstName, lastName]
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0 && part.toLowerCase() !== 'undefined');
  return parts.join(' ') || 'Unknown';
}

export const softDeletedMessageFilter: Prisma.MessageWhereInput = {
  NOT: {
    AND: [{ content: null }, { isSystem: true }],
  },
};
