import { PrismaService } from '../prisma/prisma.service';
import { CreateCenterDto, UpdateCenterDto } from './dto';
import { Prisma } from '@ilona/database';
export declare class CentersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private normalizeHexColor;
    findAll(params?: {
        skip?: number;
        take?: number;
        search?: string;
        isActive?: boolean;
    }): Promise<{
        items: ({
            _count: {
                groups: number;
            };
        } & {
            name: string;
            id: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            description: string | null;
            colorHex: string | null;
            isActive: boolean;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findActiveIdNameList(): Promise<Array<{
        id: string;
        name: string;
    }>>;
    findById(id: string): Promise<{
        _count: {
            groups: number;
        };
        groups: ({
            teacher: ({
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                bio: string | null;
                specialization: string | null;
                hourlyRate: Prisma.Decimal;
                lessonRateAMD: Prisma.Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: Prisma.JsonValue | null;
                hireDate: Date | null;
            }) | null;
            _count: {
                lessons: number;
                students: number;
            };
        } & {
            name: string;
            centerId: string;
            teacherId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            iconKey: string | null;
            level: string | null;
            maxStudents: number;
            secondTeacherId: string | null;
            secondTeacherStartsFirstWeek: boolean;
            schedule: Prisma.JsonValue | null;
        })[];
    } & {
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        description: string | null;
        colorHex: string | null;
        isActive: boolean;
    }>;
    create(dto: CreateCenterDto): Promise<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        description: string | null;
        colorHex: string | null;
        isActive: boolean;
    }>;
    update(id: string, dto: UpdateCenterDto): Promise<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        description: string | null;
        colorHex: string | null;
        isActive: boolean;
    }>;
    delete(id: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        description: string | null;
        colorHex: string | null;
        isActive: boolean;
    }>;
    toggleActive(id: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        description: string | null;
        colorHex: string | null;
        isActive: boolean;
    }>;
    getDetails(id: string): Promise<{
        center: {
            name: string;
            id: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            description: string | null;
            colorHex: string | null;
            isActive: boolean;
        };
        teachers: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
                avatarUrl: string | null;
            };
            _count: {
                groups: number;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        })[];
        groups: ({
            teacher: ({
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                bio: string | null;
                specialization: string | null;
                hourlyRate: Prisma.Decimal;
                lessonRateAMD: Prisma.Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: Prisma.JsonValue | null;
                hireDate: Date | null;
            }) | null;
            _count: {
                lessons: number;
                students: number;
            };
            students: ({
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                    avatarUrl: string | null;
                };
            } & {
                status: import("@ilona/database").$Enums.StudentStatus;
                groupId: string | null;
                centerId: string | null;
                teacherId: string | null;
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                age: number | null;
                dateOfBirth: Date | null;
                parentName: string | null;
                parentPhone: string | null;
                parentEmail: string | null;
                parentPassportInfo: string | null;
                firstLessonDate: Date | null;
                notes: string | null;
                currentStreak: number;
                riskLabel: import("@ilona/database").$Enums.RiskLabel;
                monthlyFee: Prisma.Decimal;
                enrolledAt: Date;
                registerDate: Date | null;
                receiveReports: boolean;
                leadId: string | null;
            })[];
            secondTeacher: ({
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                bio: string | null;
                specialization: string | null;
                hourlyRate: Prisma.Decimal;
                lessonRateAMD: Prisma.Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: Prisma.JsonValue | null;
                hireDate: Date | null;
            }) | null;
        } & {
            name: string;
            centerId: string;
            teacherId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            iconKey: string | null;
            level: string | null;
            maxStudents: number;
            secondTeacherId: string | null;
            secondTeacherStartsFirstWeek: boolean;
            schedule: Prisma.JsonValue | null;
        })[];
        students: {
            groupId: string;
            groupName: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
                avatarUrl: string | null;
            };
            status: import("@ilona/database").$Enums.StudentStatus;
            centerId: string | null;
            teacherId: string | null;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            age: number | null;
            dateOfBirth: Date | null;
            parentName: string | null;
            parentPhone: string | null;
            parentEmail: string | null;
            parentPassportInfo: string | null;
            firstLessonDate: Date | null;
            notes: string | null;
            currentStreak: number;
            riskLabel: import("@ilona/database").$Enums.RiskLabel;
            monthlyFee: Prisma.Decimal;
            enrolledAt: Date;
            registerDate: Date | null;
            receiveReports: boolean;
            leadId: string | null;
        }[];
        schedule: {
            groupId: string;
            groupName: string;
            schedule: Prisma.JsonValue;
        }[];
        counts: {
            teachers: number;
            groups: number;
            students: number;
        };
    }>;
    getStatistics(id: string): Promise<{
        groupsCount: number;
        studentsCount: number;
        lessonsCount: number;
    }>;
}
