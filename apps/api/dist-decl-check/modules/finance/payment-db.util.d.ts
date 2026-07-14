import { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
export type PaymentDb = {
    payment: Prisma.PaymentDelegate;
    student: Prisma.StudentDelegate;
    systemSettings: Prisma.SystemSettingsDelegate;
};
export declare function getPaymentDb(prisma: PrismaService): PaymentDb;
