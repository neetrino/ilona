import type { Prisma } from '@ilona/database';
export declare function effectiveLessonInstructorTeacherId(lesson: {
    teacherId: string;
    substituteTeacherId: string | null | undefined;
}): string;
export declare function teacherActsAsLessonInstructor(lesson: {
    teacherId: string;
    substituteTeacherId: string | null | undefined;
}, actorTeacherProfileId: string): boolean;
export declare function lessonsPayableToTeacherWhere(teacherId: string): Prisma.LessonWhereInput;
export declare function isSubstitutePayeeLesson(lesson: {
    substituteTeacherId: string | null | undefined;
}, payeeTeacherId: string): boolean;
