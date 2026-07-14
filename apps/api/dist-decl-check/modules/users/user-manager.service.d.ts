import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@ilona/database';
import { UserReadService } from './user-read.service';
export declare class UserManagerService {
    private readonly prisma;
    private readonly readService;
    constructor(prisma: PrismaService, readService: UserReadService);
    createManager(data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        phone?: string;
        centerId: string;
    }): Promise<{
        managerProfile: {
            centerId: string;
            center: {
                name: string;
                id: string;
            };
        } | null;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: UserRole;
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
        createdAt: Date;
    }>;
    updateManager(managerId: string, data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        password?: string;
        centerId?: string;
        status?: UserStatus;
    }): Promise<{
        managerProfile: {
            centerId: string;
            isCurrentAssignment: boolean;
            center: {
                name: string;
                id: string;
            };
            lastManaged: {
                centerId: string;
                centerName: string;
                managedAt: string;
            } | null;
        } | null;
        status: import("@ilona/database").$Enums.UserStatus;
        role: import("@ilona/database").$Enums.UserRole;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        createdAt: Date;
    }>;
}
