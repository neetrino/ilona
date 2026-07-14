import { Prisma } from '@ilona/database';
export type SalaryRecordDb = {
    teacher: Prisma.TeacherDelegate;
    salaryRecord: Prisma.SalaryRecordDelegate;
    lesson: Prisma.LessonDelegate;
};
type WhereForFindMany<T> = T extends (args?: infer A) => unknown ? A extends {
    where?: infer W;
} ? W : never : never;
type WhereForCount<T> = T extends (args?: infer A) => unknown ? A extends {
    where?: infer W;
} ? W : never : never;
export type TeacherWhereArg = WhereForFindMany<SalaryRecordDb['teacher']['findMany']>;
export type TeacherCountWhereArg = WhereForCount<SalaryRecordDb['teacher']['count']>;
export type SalaryRecordWhereArg = WhereForFindMany<SalaryRecordDb['salaryRecord']['findMany']>;
export type SalaryRecordCountWhereArg = WhereForCount<SalaryRecordDb['salaryRecord']['count']>;
export type SalaryListParams = {
    skip?: number;
    take?: number;
    teacherId?: string;
    status?: import('@ilona/database').SalaryStatus;
    dateFrom?: Date;
    dateTo?: Date;
    q?: string;
    centerId?: string;
};
export type SalaryTeacherListParams = {
    skip?: number;
    take?: number;
    status?: import('@ilona/database').SalaryStatus;
    dateFrom?: Date;
    dateTo?: Date;
};
export {};
