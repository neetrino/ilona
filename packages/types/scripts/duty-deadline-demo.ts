/**
 * Demo: Daily Duties completion vs payment eligibility
 * Run: npx tsx scripts/duty-deadline-demo.ts
 */
import {
  APP_TIMEZONE,
  buildDutyActionStatuses,
  buildPaymentEligibleActions,
  getDutyDeadline,
  type LessonDutyTimestamps,
} from '../src/duty-deadline';

function yerevanLocalToUtc(isoLocal: string): Date {
  const [datePart, timePart] = isoLocal.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min, secMs] = timePart.split(':');
  const [sec, ms = '0'] = secMs.split('.');
  const deadline = getDutyDeadline(new Date(`${datePart}T12:00:00.000Z`));
  void deadline;
  const probe = new Date(Date.UTC(y, m - 1, d, Number(h), Number(min), Number(sec), Number(ms)));
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  let ts = probe.getTime();
  for (let i = 0; i < 6; i++) {
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date(ts)).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
    );
    const actual = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const desired = Date.UTC(y, m - 1, d, Number(h), Number(min), Number(sec), Number(ms));
    const diff = desired - actual;
    if (Math.abs(diff) < 1000) break;
    ts += diff;
  }
  return new Date(ts);
}

const LESSON_DAY = '2026-06-15';
const lessonScheduledAt = yerevanLocalToUtc(`${LESSON_DAY}T14:00:00.000`);
const deadline = getDutyDeadline(lessonScheduledAt);

function uiState(
  status: ReturnType<typeof buildDutyActionStatuses>['absence'],
): string {
  if (status.completed && status.paymentEligible) return '🟢 Կանաչ (paid)';
  if (status.completed && status.completedLate) return '🟢 Կանաչ + «Ուշ, անվճար»';
  if (!status.completed && status.overdueUnpaid) return '🔴 Կարմիր (unpaid, not done)';
  return '🟡 Դեղին (pending, before deadline)';
}

function baseLesson(overrides: Partial<LessonDutyTimestamps>): LessonDutyTimestamps {
  return {
    scheduledAt: lessonScheduledAt,
    absenceMarked: false,
    feedbacksCompleted: false,
    voiceSent: false,
    textSent: false,
    dailyPlan: null,
    ...overrides,
  };
}

function calcSalary(paidCount: number, lessonRate = 5000, penalty = 500): number {
  return Math.max(0, lessonRate - (5 - paidCount) * penalty);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Daily Duties — Demo Test');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Lesson date:     ${LESSON_DAY} 14:00 (${APP_TIMEZONE})`);
console.log(`  Deadline:        ${LESSON_DAY} 23:59:59 (${APP_TIMEZONE})`);
console.log(`  Deadline (UTC):  ${deadline.toISOString()}`);
console.log('═══════════════════════════════════════════════════════════\n');

// ── Scenario 1: completed on time ──
console.log('📌 Scenario 1 — Absence done at 20:00 (before deadline)');
const onTimeAt = yerevanLocalToUtc(`${LESSON_DAY}T20:00:00.000`);
const s1 = buildDutyActionStatuses(
  baseLesson({ absenceMarked: true, absenceMarkedAt: onTimeAt }),
  yerevanLocalToUtc(`${LESSON_DAY}T21:00:00.000`),
);
console.log(`   UI:     ${uiState(s1.absence)}`);
console.log(`   Paid:   ${s1.absence.paymentEligible ? 'YES ✅' : 'NO ❌'}\n`);

// ── Scenario 2: not done after deadline ──
console.log('📌 Scenario 2 — Voice NOT done after 23:59 (now = next day 00:30)');
const afterDeadline = yerevanLocalToUtc('2026-06-16T00:30:00.000');
const s2 = buildDutyActionStatuses(baseLesson(), afterDeadline);
console.log(`   UI:     ${uiState(s2.voice)}`);
console.log(`   Paid:   ${s2.voice.paymentEligible ? 'YES ✅' : 'NO ❌'}`);
console.log('   Teacher must still complete it later → turns green but stays unpaid\n');

// ── Scenario 3: completed late at 00:03 ──
console.log('📌 Scenario 3 — Text completed at 00:03 (after deadline)');
const lateAt = yerevanLocalToUtc('2026-06-16T00:03:00.000');
const s3 = buildDutyActionStatuses(
  baseLesson({ textSent: true, textSentAt: lateAt }),
  yerevanLocalToUtc('2026-06-16T01:00:00.000'),
);
console.log(`   UI:     ${uiState(s3.text)}`);
console.log(`   Paid:   ${s3.text.paymentEligible ? 'YES ✅' : 'NO ❌'}\n`);

// ── Scenario 4: 2 on time, 3 missed, then 3 completed late ──
console.log('📌 Scenario 4 — 2 on-time + 3 late (your example)');
const twoOnTime = buildDutyActionStatuses(
  baseLesson({
    absenceMarked: true,
    absenceMarkedAt: yerevanLocalToUtc(`${LESSON_DAY}T18:00:00.000`),
    feedbacksCompleted: true,
    feedbacksCompletedAt: yerevanLocalToUtc(`${LESSON_DAY}T19:00:00.000`),
  }),
  afterDeadline,
);
const paidBeforeDeadline = buildPaymentEligibleActions(
  baseLesson({
    absenceMarked: true,
    absenceMarkedAt: yerevanLocalToUtc(`${LESSON_DAY}T18:00:00.000`),
    feedbacksCompleted: true,
    feedbacksCompletedAt: yerevanLocalToUtc(`${LESSON_DAY}T19:00:00.000`),
  }),
);
void paidBeforeDeadline;

const paid2 = buildPaymentEligibleActions(
  baseLesson({
    absenceMarked: true,
    absenceMarkedAt: yerevanLocalToUtc(`${LESSON_DAY}T18:00:00.000`),
    feedbacksCompleted: true,
    feedbacksCompletedAt: yerevanLocalToUtc(`${LESSON_DAY}T19:00:00.000`),
  }),
);
const paidCount2 = Object.values(paid2).filter(Boolean).length;

console.log('   After 23:59 (3 duties still missing):');
console.log(`   • Absence:  ${uiState(twoOnTime.absence)}`);
console.log(`   • Feedback: ${uiState(twoOnTime.feedbacks)}`);
console.log(`   • Voice:    ${uiState(twoOnTime.voice)}`);
console.log(`   • Text:     ${uiState(twoOnTime.text)}`);
console.log(`   • Plan:     ${uiState(twoOnTime.dailyPlan)}`);
console.log(`   Salary:     ${calcSalary(paidCount2)} AMD (2 paid × on-time, 3 penalties)\n`);

const allFiveLate = buildDutyActionStatuses(
  baseLesson({
    absenceMarked: true,
    absenceMarkedAt: yerevanLocalToUtc(`${LESSON_DAY}T18:00:00.000`),
    feedbacksCompleted: true,
    feedbacksCompletedAt: yerevanLocalToUtc(`${LESSON_DAY}T19:00:00.000`),
    voiceSent: true,
    voiceSentAt: yerevanLocalToUtc('2026-06-16T00:05:00.000'),
    textSent: true,
    textSentAt: yerevanLocalToUtc('2026-06-16T00:06:00.000'),
    dailyPlan: { id: 'plan-1', createdAt: yerevanLocalToUtc('2026-06-16T00:10:00.000') },
  }),
  yerevanLocalToUtc('2026-06-16T01:00:00.000'),
);
const paidAfterLate = buildPaymentEligibleActions(
  baseLesson({
    absenceMarked: true,
    absenceMarkedAt: yerevanLocalToUtc(`${LESSON_DAY}T18:00:00.000`),
    feedbacksCompleted: true,
    feedbacksCompletedAt: yerevanLocalToUtc(`${LESSON_DAY}T19:00:00.000`),
    voiceSent: true,
    voiceSentAt: yerevanLocalToUtc('2026-06-16T00:05:00.000'),
    textSent: true,
    textSentAt: yerevanLocalToUtc('2026-06-16T00:06:00.000'),
    dailyPlan: { id: 'plan-1', createdAt: yerevanLocalToUtc('2026-06-16T00:10:00.000') },
  }),
);
const paidCountFinal = Object.values(paidAfterLate).filter(Boolean).length;

console.log('   After completing 3 late at 00:05–00:10:');
console.log(`   • Voice:    ${uiState(allFiveLate.voice)}`);
console.log(`   • Text:     ${uiState(allFiveLate.text)}`);
console.log(`   • Plan:     ${uiState(allFiveLate.dailyPlan)}`);
console.log(`   Completed: 5/5 ✅ (all green)`);
console.log(`   Paid:      ${paidCountFinal}/5 (still only 2 — salary unchanged)`);
console.log(`   Salary:    ${calcSalary(paidCountFinal)} AMD\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('  ✅ Demo complete');
console.log('═══════════════════════════════════════════════════════════\n');
