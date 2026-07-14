import { Prisma } from '@ilona/database';
export declare function isPlannedAbsencesTableMissing(err: unknown): boolean;
export declare function updateStudentStreakOnAttendanceChange(tx: Prisma.TransactionClient, studentId: string, nextIsPresent: boolean): Promise<void>;
