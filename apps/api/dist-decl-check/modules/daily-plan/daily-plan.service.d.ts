import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from '../finance/salaries.service';
import { CreateDailyPlanDto, UpdateDailyPlanDto, QueryDailyPlanDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
export declare class DailyPlanService {
    private readonly prisma;
    private readonly salariesService;
    constructor(prisma: PrismaService, salariesService: SalariesService);
    private triggerSalaryRecalculationForPlan;
    private resolveTeacherId;
    private serializePlan;
    private assertPlanEditAccess;
    private canUserEditPlan;
    findAll(query: QueryDailyPlanDto, user: JwtPayload): Promise<{
        items: {
            canEdit: boolean;
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                centerId: string;
                id: string;
                level: string | null;
            } | null;
            teacher: {
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                };
                id: string;
            };
            lesson: {
                group: {
                    name: string;
                    center: {
                        name: string;
                        id: string;
                    };
                    centerId: string;
                    id: string;
                };
                id: string;
                scheduledAt: Date;
            } | null;
            topics: ({
                resources: {
                    id: string;
                    link: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    title: string;
                    description: string | null;
                    topicId: string;
                    kind: import("@ilona/database").$Enums.DailyPlanResourceKind;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                order: number;
                dailyPlanId: string;
            })[];
            groupId: string | null;
            teacherId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lessonId: string | null;
            date: Date;
        }[];
        total: number;
        take: number;
        skip: number;
    }>;
    findById(id: string, user: JwtPayload): Promise<{
        canEdit: boolean;
        group: {
            name: string;
            center: {
                name: string;
                id: string;
            };
            centerId: string;
            id: string;
            level: string | null;
        } | null;
        teacher: {
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        };
        lesson: {
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                centerId: string;
                id: string;
            };
            id: string;
            scheduledAt: Date;
        } | null;
        topics: ({
            resources: {
                id: string;
                link: string | null;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string | null;
                topicId: string;
                kind: import("@ilona/database").$Enums.DailyPlanResourceKind;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            order: number;
            dailyPlanId: string;
        })[];
        groupId: string | null;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        lessonId: string | null;
        date: Date;
    }>;
    create(dto: CreateDailyPlanDto, user: JwtPayload): Promise<{
        canEdit: boolean;
        group: {
            name: string;
            center: {
                name: string;
                id: string;
            };
            centerId: string;
            id: string;
            level: string | null;
        } | null;
        teacher: {
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        };
        lesson: {
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                centerId: string;
                id: string;
            };
            id: string;
            scheduledAt: Date;
        } | null;
        topics: ({
            resources: {
                id: string;
                link: string | null;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string | null;
                topicId: string;
                kind: import("@ilona/database").$Enums.DailyPlanResourceKind;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            order: number;
            dailyPlanId: string;
        })[];
        groupId: string | null;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        lessonId: string | null;
        date: Date;
    }>;
    update(id: string, dto: UpdateDailyPlanDto, user: JwtPayload): Promise<{
        canEdit: boolean;
        group: {
            name: string;
            center: {
                name: string;
                id: string;
            };
            centerId: string;
            id: string;
            level: string | null;
        } | null;
        teacher: {
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        };
        lesson: {
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                centerId: string;
                id: string;
            };
            id: string;
            scheduledAt: Date;
        } | null;
        topics: ({
            resources: {
                id: string;
                link: string | null;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string | null;
                topicId: string;
                kind: import("@ilona/database").$Enums.DailyPlanResourceKind;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            order: number;
            dailyPlanId: string;
        })[];
        groupId: string | null;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        lessonId: string | null;
        date: Date;
    }>;
    remove(id: string, user: JwtPayload): Promise<{
        readonly ok: true;
    }>;
}
