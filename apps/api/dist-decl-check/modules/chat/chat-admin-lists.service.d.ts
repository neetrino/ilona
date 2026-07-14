import { PrismaService } from '../prisma/prisma.service';
export declare class ChatAdminListsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAdminStudents(_adminId: string, search?: string, branchCenterId?: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    getAdminTeachers(_adminId: string, search?: string, branchCenterId?: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    getAdminGroups(_adminId: string, search?: string, branchCenterId?: string): Promise<{
        id: string;
        name: string;
        iconKey: string | null;
        center: {
            id: string;
            name: string;
        } | null;
    }[]>;
    getAdminAllUsers(_adminId: string, search?: string, branchCenterId?: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        email: string;
        phone: string | undefined;
        avatarUrl: string | undefined;
        role: import("@ilona/database").$Enums.UserRole;
    }[]>;
}
