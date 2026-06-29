import type { Prisma } from '@ilona/database';

export const groupTeacherUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
} as const;

export const groupTeacherInclude = {
  include: {
    user: { select: groupTeacherUserSelect },
  },
} as const;

export const groupDetailTeacherInclude = {
  include: {
    user: {
      select: {
        ...groupTeacherUserSelect,
        phone: true,
      },
    },
  },
} as const;

export const groupListInclude = (includeStudents?: boolean): Prisma.GroupInclude => ({
  center: { select: { id: true, name: true } },
  teacher: groupTeacherInclude,
  secondTeacher: groupTeacherInclude,
  _count: { select: { students: true, lessons: true } },
  ...(includeStudents
    ? {
        students: {
          orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }],
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      }
    : {}),
});

export const groupDetailInclude = {
  center: true,
  teacher: groupDetailTeacherInclude,
  secondTeacher: groupDetailTeacherInclude,
  students: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          status: true,
        },
      },
    },
  },
  chat: { select: { id: true } },
  _count: { select: { students: true, lessons: true } },
} as const;

export const groupWriteInclude = {
  center: { select: { id: true, name: true } },
  teacher: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
  secondTeacher: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
} as const;
