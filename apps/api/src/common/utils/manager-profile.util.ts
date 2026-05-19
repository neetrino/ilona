import type { PrismaService } from '../../modules/prisma/prisma.service';

/** Prisma filter for the single active manager assignment on a center. */
export const currentManagerAssignmentWhere = {
  isCurrentAssignment: true,
} as const;

export async function findCurrentManagerUserIdForCenter(
  prisma: PrismaService,
  centerId: string,
): Promise<string | null> {
  const row = await prisma.managerProfile.findFirst({
    where: {
      centerId,
      ...currentManagerAssignmentWhere,
      user: { status: 'ACTIVE' },
    },
    select: { userId: true },
  });
  return row?.userId ?? null;
}
