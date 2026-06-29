import { Prisma } from '@ilona/database';

export const paymentStudentIncludeBasic: Prisma.StudentInclude = {
  user: {
    select: { firstName: true, lastName: true, email: true },
  },
};

export const paymentStudentIncludeWithGroup: Prisma.StudentInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  group: {
    select: { id: true, name: true },
  },
};

export const paymentStudentIncludeWithPhone: Prisma.StudentInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  group: {
    select: { id: true, name: true },
  },
};
