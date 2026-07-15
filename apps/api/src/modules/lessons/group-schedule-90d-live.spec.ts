import { describe, expect, it, afterAll } from 'vitest';
import { LessonCreationSource, PrismaClient, type Prisma } from '@ilona/database';
import { parseGroupSchedulePayload } from '../groups/group-schedule-payload';

type GroupScheduleFixture = {
  id: string;
  name: string;
  schedule: Prisma.JsonValue;
};

/**
 * Live DB smoke check against a group previously extended via cron.
 * Skips automatically if DB is unreachable or the fixture group is missing.
 */
describe('90-day rolling — live DB verification', () => {
  const prisma = new PrismaClient();
  const GROUP_ID = 'cmqdryul0004wekahvy0zq6k0';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('extended group has rolling calendar + GROUP_SCHEDULE lessons through new horizon', async () => {
    let group: GroupScheduleFixture | null;
    try {
      group = await prisma.group.findUnique({
        where: { id: GROUP_ID },
        select: { id: true, name: true, schedule: true },
      });
    } catch {
      console.warn('DB unreachable — skipping live verification');
      return;
    }
    if (!group) {
      console.warn('Fixture group missing — skipping');
      return;
    }

    const { calendar, weeklySlots } = parseGroupSchedulePayload(group.schedule);
    expect(calendar).not.toBeNull();
    if (!calendar) return;

    expect(calendar.dateFrom).toBeTruthy();
    expect(calendar.dateTo).toBeTruthy();
    expect(calendar.rolling !== false).toBe(true);
    expect(weeklySlots.length).toBeGreaterThan(0);

    const total = await prisma.lesson.count({
      where: { groupId: GROUP_ID, creationSource: LessonCreationSource.GROUP_SCHEDULE },
    });
    expect(total).toBeGreaterThan(20);

    const last = await prisma.lesson.findFirst({
      where: { groupId: GROUP_ID, creationSource: LessonCreationSource.GROUP_SCHEDULE },
      orderBy: { scheduledAt: 'desc' },
      select: { scheduledAt: true },
    });
    expect(last).not.toBeNull();
    if (!last) return;

    const lastIso = last.scheduledAt.toISOString().slice(0, 10);
    expect(lastIso <= calendar.dateTo).toBe(true);
    expect(calendar.dateTo >= '2026-09-27').toBe(true);

    console.log(
      JSON.stringify(
        {
          group: group.name,
          dateFrom: calendar.dateFrom,
          dateTo: calendar.dateTo,
          rolling: calendar.rolling,
          groupScheduleLessons: total,
          lastLessonUtc: last.scheduledAt.toISOString(),
        },
        null,
        2,
      ),
    );
  });
});
