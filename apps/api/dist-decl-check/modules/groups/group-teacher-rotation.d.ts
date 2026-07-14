export declare function startOfIsoWeek(date: Date): Date;
export declare function weekIndexSinceScheduleStart(lessonDate: Date, scheduleStartDateYmd: string): number;
export declare function resolveRotatingTeacherId(params: {
    lessonDate: Date;
    teacherId: string;
    secondTeacherId: string;
    scheduleStartDateYmd: string;
    secondTeacherStartsFirstWeek?: boolean;
}): string;
export declare function weekIndexSinceAnchor(lessonDate: Date, anchorDateYmd: string): number;
export declare function groupTeacherIds(group: {
    teacherId: string | null;
    secondTeacherId: string | null;
}): string[];
export declare function isGroupTeacher(teacherId: string, group: {
    teacherId: string | null;
    secondTeacherId: string | null;
}): boolean;
