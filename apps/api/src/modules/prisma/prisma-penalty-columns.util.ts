import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@ilona/database';

const PENALTY_COLUMNS_SQL = `
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyAbsenceAmd" DECIMAL(10, 2);
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyFeedbackAmd" DECIMAL(10, 2);
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyVoiceAmd" DECIMAL(10, 2);
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyTextAmd" DECIMAL(10, 2);
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyDailyPlanAmd" DECIMAL(10, 2);
ALTER TABLE "system_settings" ALTER COLUMN "penaltyAbsenceAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyFeedbackAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyVoiceAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyTextAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyDailyPlanAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyAbsenceAmd" DROP NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyFeedbackAmd" DROP NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyVoiceAmd" DROP NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyTextAmd" DROP NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyDailyPlanAmd" DROP NOT NULL;
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "absencePercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "feedbacksPercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "voicePercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "textPercent";
`;

export async function ensurePenaltyAmountColumns(
  prisma: Pick<PrismaClient, '$queryRawUnsafe' | '$executeRawUnsafe'>,
  logger: Logger,
): Promise<void> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'system_settings'
         AND column_name IN (
           'penaltyAbsenceAmd',
           'penaltyFeedbackAmd',
           'penaltyVoiceAmd',
           'penaltyTextAmd',
           'penaltyDailyPlanAmd'
         )`,
    );

    if (rows.length >= 5) {
      return;
    }

    logger.warn(
      'Penalty amount columns missing on system_settings; applying schema reconcile now.',
    );

    for (const statement of PENALTY_COLUMNS_SQL.split(';').map((s) => s.trim()).filter(Boolean)) {
      await prisma.$executeRawUnsafe(statement);
    }

    logger.log('Penalty amount columns ensured on system_settings');
  } catch (err) {
    logger.error('ensurePenaltyAmountColumns failed', err);
    throw err;
  }
}
