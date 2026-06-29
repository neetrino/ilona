import { Prisma } from '@ilona/database';

export function isPlannedAbsencesTableMissing(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021';
}

export async function updateStudentStreakOnAttendanceChange(
  tx: Prisma.TransactionClient,
  studentId: string,
  nextIsPresent: boolean,
): Promise<void> {
  if (!nextIsPresent) {
    await tx.student.update({
      where: { id: studentId },
      data: { currentStreak: 0 },
    });
    return;
  }

  await tx.student.update({
    where: { id: studentId },
    data: { currentStreak: { increment: 1 } },
  });
}
