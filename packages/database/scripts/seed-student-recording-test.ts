/**
 * One-off: put Test Student into a real group/lesson today, clear recordings,
 * recreate STUDENT_RECORDING_MISSING with chat deep-link.
 *
 * From packages/database:
 *   pnpm exec tsx ./scripts/seed-student-recording-test.ts
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient, LessonStatus, UserRole } from '../src/generated/client';

config({ path: resolve(__dirname, '../../../.env') });

const APP_TIMEZONE = 'Asia/Yerevan';

function getCalendarDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function zonedParts(ymd: string, timeZone: string, hour: number, minute: number, second: number) {
  // Approximate via iterative approach using UTC offset sampling
  const [y, m, d] = ymd.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hour, minute, second));
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(guess).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  const offset = asUtc - guess.getTime();
  return new Date(guess.getTime() - offset);
}

function startOfZonedDay(ymd: string, timeZone: string): Date {
  return zonedParts(ymd, timeZone, 0, 0, 0);
}

function endOfZonedDay(ymd: string, timeZone: string): Date {
  return zonedParts(ymd, timeZone, 23, 59, 59);
}

const prisma = new PrismaClient();

function formatLessonLabel(lesson: {
  topic: string | null;
  scheduledAt: Date;
  group: { name: string };
}): string {
  const when = new Intl.DateTimeFormat('hy-AM', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: APP_TIMEZONE,
  }).format(lesson.scheduledAt);
  return `${lesson.topic?.trim() || lesson.group.name} · ${when}`;
}

function buildCopy(lessonLabel: string): string {
  return [
    `Սիրելի՛ սովորող, ցանկանում ենք հիշեցնել, որ դեռ չես ուղարկել քո ձայնագրությունը այս դասի համար՝`,
    `«${lessonLabel}»։`,
    `Հնարավոր է՝ հոգնած ես կամ այսօր չես կարողացել անհրաժեշտ ժամանակ հատկացնել։ Բայց հիշիր՝ այն, ինչ անում ես այսօր, քո վաղվա օրվա կարևոր ներդրումն է💙`,
  ].join('\n');
}

function buildHref(teacherUserId: string, lessonId: string): string {
  return (
    `/student/chat?type=dm&teacherId=${encodeURIComponent(teacherUserId)}` +
    `&record=1&lessonId=${encodeURIComponent(lessonId)}`
  );
}

async function main() {
  const now = new Date();
  const ymd = getCalendarDateInTimezone(now, APP_TIMEZONE);
  const dayStart = startOfZonedDay(ymd, APP_TIMEZONE);
  const dayEnd = new Date(endOfZonedDay(ymd, APP_TIMEZONE).getTime() + 1);

  const studentUser = await prisma.user.findFirst({
    where: {
      role: UserRole.STUDENT,
      OR: [
        { firstName: { contains: 'Test', mode: 'insensitive' } },
        { lastName: { contains: 'Test', mode: 'insensitive' } },
        { email: { contains: 'student', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      student: { select: { id: true, groupId: true, teacherId: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!studentUser?.student) {
    throw new Error('Test student user/profile not found');
  }

  console.log('Student:', {
    userId: studentUser.id,
    name: `${studentUser.firstName} ${studentUser.lastName}`,
    email: studentUser.email,
    studentId: studentUser.student.id,
    prevGroupId: studentUser.student.groupId,
  });

  let lesson = await prisma.lesson.findFirst({
    where: {
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { not: LessonStatus.CANCELLED },
      group: { isActive: true },
    },
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      topic: true,
      scheduledAt: true,
      teacherId: true,
      substituteTeacherId: true,
      groupId: true,
      group: { select: { id: true, name: true, teacherId: true } },
      teacher: {
        select: { id: true, userId: true, user: { select: { firstName: true, lastName: true } } },
      },
      substituteTeacher: {
        select: { id: true, userId: true, user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!lesson) {
    const anyLesson = await prisma.lesson.findFirst({
      where: { status: { not: LessonStatus.CANCELLED }, group: { isActive: true } },
      orderBy: { scheduledAt: 'desc' },
      select: {
        topic: true,
        duration: true,
        teacherId: true,
        groupId: true,
        creationSource: true,
      },
    });
    if (!anyLesson) {
      throw new Error('No real lessons/groups found in DB');
    }

    const scheduledAt = new Date(dayStart.getTime() + 12 * 60 * 60 * 1000);
    lesson = await prisma.lesson.create({
      data: {
        groupId: anyLesson.groupId,
        teacherId: anyLesson.teacherId,
        scheduledAt,
        duration: anyLesson.duration || 60,
        topic: anyLesson.topic || 'Voice test lesson',
        status: LessonStatus.COMPLETED,
        creationSource: anyLesson.creationSource,
      },
      select: {
        id: true,
        topic: true,
        scheduledAt: true,
        teacherId: true,
        substituteTeacherId: true,
        groupId: true,
        group: { select: { id: true, name: true, teacherId: true } },
        teacher: {
          select: { id: true, userId: true, user: { select: { firstName: true, lastName: true } } },
        },
        substituteTeacher: {
          select: { id: true, userId: true, user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    console.log('Created today lesson for test:', lesson.id);
  }

  const teacherUserId = lesson.substituteTeacher?.userId ?? lesson.teacher.userId;
  const teacherProfileId = lesson.substituteTeacherId ?? lesson.teacherId;
  const teacherUser = lesson.substituteTeacher?.user ?? lesson.teacher.user;

  await prisma.student.update({
    where: { id: studentUser.student.id },
    data: {
      groupId: lesson.groupId,
      teacherId: teacherProfileId,
    },
  });

  const deletedRecordings = await prisma.recordingItem.deleteMany({
    where: {
      studentId: studentUser.student.id,
      lessonId: lesson.id,
    },
  });

  const oldNotifs = await prisma.notification.findMany({
    where: {
      userId: studentUser.id,
      type: 'STUDENT_RECORDING_MISSING',
    },
    select: { id: true },
  });
  if (oldNotifs.length > 0) {
    await prisma.notification.deleteMany({
      where: { id: { in: oldNotifs.map((n) => n.id) } },
    });
  }

  const lessonLabel = formatLessonLabel(lesson);
  const href = buildHref(teacherUserId, lesson.id);
  const dedupeKey = `STUDENT_RECORDING_MISSING:${studentUser.id}:${lesson.id}:${studentUser.student.id}:${ymd}`;

  const notif = await prisma.notification.create({
    data: {
      userId: studentUser.id,
      type: 'STUDENT_RECORDING_MISSING',
      title: 'Recording missing for today’s lesson',
      content: buildCopy(lessonLabel),
      data: {
        studentId: studentUser.student.id,
        lessonId: lesson.id,
        groupId: lesson.groupId,
        teacherId: teacherUserId,
        href,
        dedupeKey,
      },
      isRead: false,
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        group: { id: lesson.groupId, name: lesson.group.name },
        lesson: {
          id: lesson.id,
          topic: lesson.topic,
          scheduledAt: lesson.scheduledAt.toISOString(),
          label: lessonLabel,
        },
        teacher: {
          profileId: teacherProfileId,
          userId: teacherUserId,
          name: `${teacherUser.firstName} ${teacherUser.lastName}`,
        },
        deletedRecordings: deletedRecordings.count,
        deletedOldNotifs: oldNotifs.length,
        notificationId: notif.id,
        href,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
