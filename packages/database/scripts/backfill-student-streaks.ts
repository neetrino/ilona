/**
 * Backfill `student_streaks` for every existing student.
 *
 * For each student we mirror `StudentStreakService.recomputeStreak`:
 * walk attendance entries (most recent completed lessons first) and count
 * the uninterrupted run of `isPresent = true` rows.
 *
 * Run with:
 *   pnpm --filter @ilona/database tsx scripts/backfill-student-streaks.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { PrismaClient } from '../src/generated/client';

// Load .env.local from project root, mirroring seed.ts.
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

interface StreakOutcome {
  currentStreak: number;
  lastAttendanceDate: Date | null;
}

async function computeStreakForStudent(studentId: string): Promise<StreakOutcome> {
  const attendances = await prisma.attendance.findMany({
    where: { studentId, lesson: { status: 'COMPLETED' } },
    include: { lesson: { select: { scheduledAt: true } } },
    orderBy: { lesson: { scheduledAt: 'desc' } },
  });

  let currentStreak = 0;
  let lastAttendanceDate: Date | null = null;
  for (const entry of attendances) {
    if (!entry.isPresent) break;
    currentStreak += 1;
    if (!lastAttendanceDate && entry.lesson?.scheduledAt) {
      lastAttendanceDate = entry.lesson.scheduledAt;
    }
  }
  return { currentStreak, lastAttendanceDate };
}

async function backfill(): Promise<void> {
  const students = await prisma.student.findMany({ select: { id: true } });
  console.log(`Found ${students.length} students. Starting backfill...`);

  let processed = 0;
  let withStreak = 0;
  for (const { id } of students) {
    const { currentStreak, lastAttendanceDate } = await computeStreakForStudent(id);
    await prisma.studentStreak.upsert({
      where: { studentId: id },
      create: { studentId: id, currentStreak, lastAttendanceDate },
      update: { currentStreak, lastAttendanceDate },
    });
    processed += 1;
    if (currentStreak > 0) withStreak += 1;
    if (processed % 25 === 0) {
      console.log(`  …processed ${processed}/${students.length}`);
    }
  }

  console.log(`Done. Updated ${processed} streaks (${withStreak} with active streak).`);
}

backfill()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
