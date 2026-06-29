import { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';

export type PaymentDb = {
  payment: Prisma.PaymentDelegate;
  student: Prisma.StudentDelegate;
  systemSettings: Prisma.SystemSettingsDelegate;
};

/** Prisma delegate access (payment, student, systemSettings). */
export function getPaymentDb(prisma: PrismaService): PaymentDb {
  return prisma as unknown as PaymentDb;
}
