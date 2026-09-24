import { APP_TIMEZONE } from '@ilona/types';
import { effectiveLessonInstructorTeacherId } from '../../common/lesson-instructor';

type LessonForRecordingHref = {
  topic: string | null;
  scheduledAt: Date;
  teacherId: string;
  substituteTeacherId: string | null;
  group: { name: string };
  teacher: { userId: string };
  substituteTeacher: { userId: string } | null;
};

export function formatStudentRecordingLessonLabel(lesson: {
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

export function buildStudentRecordingCopy(lessonLabel: string): string {
  return [
    `Սիրելի՛ սովորող, ցանկանում ենք հիշեցնել, որ դեռ չես ուղարկել քո ձայնագրությունը այս դասի համար՝`,
    `«${lessonLabel}»։`,
    `Հնարավոր է՝ հոգնած ես կամ այսօր չես կարողացել անհրաժեշտ ժամանակ հատկացնել։ Բայց հիշիր՝ այն, ինչ անում ես այսօր, քո վաղվա օրվա կարևոր ներդրումն է💙`,
  ].join('\n');
}

export function resolveStudentRecordingTeacherUserId(lesson: LessonForRecordingHref): string | null {
  const instructorTeacherId = effectiveLessonInstructorTeacherId(lesson);
  if (lesson.substituteTeacherId === instructorTeacherId) {
    return lesson.substituteTeacher?.userId ?? null;
  }
  return lesson.teacher.userId;
}

export function buildStudentRecordingChatHref(teacherUserId: string, lessonId: string): string {
  return (
    `/student/chat?type=dm&teacherId=${encodeURIComponent(teacherUserId)}` +
    `&record=1&lessonId=${encodeURIComponent(lessonId)}`
  );
}

export const studentRecordingLessonSelect = {
  topic: true,
  scheduledAt: true,
  teacherId: true,
  substituteTeacherId: true,
  group: { select: { name: true } },
  teacher: { select: { userId: true } },
  substituteTeacher: { select: { userId: true } },
} as const;
