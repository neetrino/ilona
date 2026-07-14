import { Prisma } from '@ilona/database';
export type PaymentWithStudent = Prisma.PaymentGetPayload<{
    include: {
        student: {
            include: {
                user: {
                    select: {
                        firstName: true;
                        lastName: true;
                        email: true;
                    };
                };
                group: {
                    select: {
                        id: true;
                        name: true;
                    };
                };
            };
        };
    };
}>;
export type PaymentGroupByMethod = {
    paymentMethod: string | null;
    _sum: {
        amount: Prisma.Decimal | null;
    };
    _count: number;
};
