import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@ilona/database';

export async function ensurePlannedAbsencesTable(
  prisma: Pick<PrismaClient, '$queryRawUnsafe' | '$executeRawUnsafe'>,
  logger: Logger,
): Promise<void> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ cnt: bigint }>>(
      `SELECT COUNT(*)::bigint AS cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'planned_absences'`,
    );
    const cnt = Number(rows[0]?.cnt ?? 0);
    if (cnt > 0) {
      return;
    }

    logger.warn(
      'Table planned_absences is missing; creating it now (run prisma migrate deploy when convenient to record migration history).',
    );

    await prisma.$executeRawUnsafe(`
CREATE TABLE "planned_absences" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned_absence',
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "planned_absences_pkey" PRIMARY KEY ("id")
);`);

    await prisma.$executeRawUnsafe(
      `CREATE INDEX "planned_absences_studentId_idx" ON "planned_absences"("studentId");`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "planned_absences_date_idx" ON "planned_absences"("date");`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX "planned_absences_studentId_date_key" ON "planned_absences"("studentId", "date");`,
    );
    await prisma.$executeRawUnsafe(`
ALTER TABLE "planned_absences" ADD CONSTRAINT "planned_absences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);

    logger.log('Table planned_absences created successfully');
  } catch (err) {
    logger.error('ensurePlannedAbsencesTable failed', err);
  }
}
