import { randomUUID } from 'crypto';
import type { Prisma } from '@ilona/database';

export async function syncStudentGroupHistory(
  tx: Prisma.TransactionClient,
  studentId: string,
  previousGroupId: string | null,
  nextGroupId: string | null,
  joinedAt: Date = new Date(),
): Promise<void> {
  if (previousGroupId === nextGroupId) {
    return;
  }

  if (previousGroupId) {
    await tx.$executeRaw`
      UPDATE "student_group_histories"
      SET "leftAt" = ${joinedAt}, "updatedAt" = ${joinedAt}
      WHERE "studentId" = ${studentId} AND "leftAt" IS NULL
    `;
  }

  if (nextGroupId) {
    await tx.$executeRaw`
      INSERT INTO "student_group_histories" ("id", "studentId", "groupId", "joinedAt", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${studentId}, ${nextGroupId}, ${joinedAt}, ${joinedAt}, ${joinedAt})
    `;
  }
}
