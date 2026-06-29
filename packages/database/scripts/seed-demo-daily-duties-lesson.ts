import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '../src/generated/client';

dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'teacher@ilona.edu' },
    include: { teacher: true },
  });
  if (!user?.teacher) throw new Error('Demo teacher not found');

  const teacherId = user.teacher.id;

  let group = await prisma.group.findFirst({
    where: { teacherId },
    select: { id: true, name: true },
  });

  if (!group) {
    const center = await prisma.center.findFirst({ select: { id: true } });
    if (!center) throw new Error('No center found');
    group = await prisma.group.create({
      data: {
        name: 'Demo Daily Duties Group',
        centerId: center.id,
        teacherId,
        level: 'A1',
      },
      select: { id: true, name: true },
    });
    console.log('Created group:', group.name);
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);

  const onTimeAt = new Date(yesterday);
  onTimeAt.setHours(18, 0, 0, 0);

  const existing = await prisma.lesson.findFirst({
    where: {
      teacherId,
      scheduledAt: {
        gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        lt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1),
      },
    },
  });

  const lesson =
    existing ??
    (await prisma.lesson.create({
      data: {
        groupId: group.id,
        teacherId,
        scheduledAt: yesterday,
        duration: 60,
        topic: 'Daily Duties Demo Lesson',
        status: 'SCHEDULED',
        absenceMarked: true,
        absenceMarkedAt: onTimeAt,
        feedbacksCompleted: true,
        feedbacksCompletedAt: onTimeAt,
        voiceSent: false,
        textSent: false,
      },
    }));

  if (existing) {
    await prisma.lesson.update({
      where: { id: existing.id },
      data: {
        absenceMarked: true,
        absenceMarkedAt: onTimeAt,
        feedbacksCompleted: true,
        feedbacksCompletedAt: onTimeAt,
        voiceSent: false,
        voiceSentAt: null,
        textSent: false,
        textSentAt: null,
        dailyPlan: { delete: true },
      },
    });
  }

  console.log('Demo lesson ready:');
  console.log(`  id: ${lesson.id}`);
  console.log(`  scheduledAt: ${yesterday.toISOString()}`);
  console.log('  2 duties on-time (absence, feedback), 3 unpaid (voice, text, daily plan)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
