import { PrismaService } from '../prisma/prisma.service';
import type { SalaryRecordDb } from './salary-record.types';
export declare function getSalaryRecordDb(prisma: PrismaService): SalaryRecordDb;
export declare const salaryRecordTeacherUserSelect: {
    readonly id: true;
    readonly firstName: true;
    readonly lastName: true;
    readonly email: true;
};
export declare const salaryRecordTeacherInclude: {
    readonly teacher: {
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly email: true;
                };
            };
        };
    };
};
export declare const salaryRecordDetailTeacherInclude: {
    readonly teacher: {
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly phone: true;
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly email: true;
                };
            };
        };
    };
};
export declare const teacherListInclude: {
    readonly user: {
        readonly select: {
            readonly id: true;
            readonly firstName: true;
            readonly lastName: true;
            readonly email: true;
        };
    };
};
