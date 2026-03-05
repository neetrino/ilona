/// <reference types="node" />
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { PrismaClient } from '../src/generated/client';

// Load .env.local from project root (same as other scripts)
const possibleEnvPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(__dirname, '../../../.env.local'),
];
for (const p of possibleEnvPaths) {
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Only ensure default system settings exist (single config row). All other data lives in the database.
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      vocabDeductionPercent: 10,
      feedbackDeductionPercent: 5,
      maxUnjustifiedAbsences: 3,
      paymentDueDays: 5,
      lessonReminderHours: 24,
      absencePercent: 25,
      feedbacksPercent: 25,
      voicePercent: 25,
      textPercent: 25,
      penaltyAbsenceAmd: 1000,
      penaltyFeedbackAmd: 1000,
      penaltyVoiceAmd: 1000,
      penaltyTextAmd: 1000,
    },
  });

  console.log('✅ Seed complete. Data is managed in the database only.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
