import { PrismaService } from '../prisma/prisma.service';
import type { SalaryRecordDb } from './salary-record.types';

export function getSalaryRecordDb(prisma: PrismaService): SalaryRecordDb {
  return prisma as unknown as SalaryRecordDb;
}

export const salaryRecordTeacherUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const salaryRecordTeacherInclude = {
  teacher: {
    include: {
      user: {
        select: salaryRecordTeacherUserSelect,
      },
    },
  },
} as const;

export const salaryRecordDetailTeacherInclude = {
  teacher: {
    include: {
      user: {
        select: {
          ...salaryRecordTeacherUserSelect,
          phone: true,
        },
      },
    },
  },
} as const;

export const teacherListInclude = {
  user: {
    select: salaryRecordTeacherUserSelect,
  },
} as const;
