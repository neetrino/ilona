import { Prisma } from '@ilona/database';

/** Payment row with student (and user/group) for monthly grouped list. */
export type PaymentWithStudent = Prisma.PaymentGetPayload<{
  include: {
    student: {
      include: {
        user: { select: { firstName: true; lastName: true; email: true } };
        group: { select: { id: true; name: true } };
      };
    };
  };
}>;

/** Result row from payment.groupBy({ by: ['paymentMethod'], ... }). */
export type PaymentGroupByMethod = {
  paymentMethod: string | null;
  _sum: { amount: Prisma.Decimal | null };
  _count: number;
};
