import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
export declare class TeacherStatisticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStatistics(id: string, dateFrom?: Date, dateTo?: Date, currentUser?: JwtPayload): Promise<{
        lessons: {
            total: number;
            completed: number;
            cancelled: number;
            scheduled: number;
        };
        compliance: {
            vocabularyRate: number;
            feedbackRate: number;
        };
        deductions: {
            count: number;
            total: number | Prisma.Decimal;
        };
        studentsCount: number;
        groupsCount: number;
    }>;
    getMyDashboard(userId: string): Promise<{
        teacher: {
            id: string;
        };
        todayLessons: ({
            group: {
                name: string;
                id: string;
                _count: {
                    students: number;
                };
                level: string | null;
            };
            _count: {
                feedbacks: number;
                attendances: number;
            };
        } & {
            status: import("@ilona/database").$Enums.LessonStatus;
            groupId: string;
            teacherId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            duration: number;
            description: string | null;
            topic: string | null;
            creationSource: import("@ilona/database").$Enums.LessonCreationSource;
            substituteTeacherId: string | null;
            scheduledAt: Date;
            vocabularySent: boolean;
            vocabularySentAt: Date | null;
            feedbacksCompleted: boolean;
            feedbacksCompletedAt: Date | null;
            absenceMarked: boolean;
            absenceMarkedAt: Date | null;
            voiceSent: boolean;
            voiceSentAt: Date | null;
            textSent: boolean;
            textSentAt: Date | null;
            completedAt: Date | null;
        })[];
        upcomingLessons: ({
            group: {
                name: string;
                id: string;
            };
        } & {
            status: import("@ilona/database").$Enums.LessonStatus;
            groupId: string;
            teacherId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            duration: number;
            description: string | null;
            topic: string | null;
            creationSource: import("@ilona/database").$Enums.LessonCreationSource;
            substituteTeacherId: string | null;
            scheduledAt: Date;
            vocabularySent: boolean;
            vocabularySentAt: Date | null;
            feedbacksCompleted: boolean;
            feedbacksCompletedAt: Date | null;
            absenceMarked: boolean;
            absenceMarkedAt: Date | null;
            voiceSent: boolean;
            voiceSentAt: Date | null;
            textSent: boolean;
            textSentAt: Date | null;
            completedAt: Date | null;
        })[];
        pendingTasks: {
            feedback: ({
                group: {
                    name: string;
                    id: string;
                };
            } & {
                status: import("@ilona/database").$Enums.LessonStatus;
                groupId: string;
                teacherId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                duration: number;
                description: string | null;
                topic: string | null;
                creationSource: import("@ilona/database").$Enums.LessonCreationSource;
                substituteTeacherId: string | null;
                scheduledAt: Date;
                vocabularySent: boolean;
                vocabularySentAt: Date | null;
                feedbacksCompleted: boolean;
                feedbacksCompletedAt: Date | null;
                absenceMarked: boolean;
                absenceMarkedAt: Date | null;
                voiceSent: boolean;
                voiceSentAt: Date | null;
                textSent: boolean;
                textSentAt: Date | null;
                completedAt: Date | null;
            })[];
            vocabulary: ({
                group: {
                    name: string;
                    id: string;
                };
            } & {
                status: import("@ilona/database").$Enums.LessonStatus;
                groupId: string;
                teacherId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                duration: number;
                description: string | null;
                topic: string | null;
                creationSource: import("@ilona/database").$Enums.LessonCreationSource;
                substituteTeacherId: string | null;
                scheduledAt: Date;
                vocabularySent: boolean;
                vocabularySentAt: Date | null;
                feedbacksCompleted: boolean;
                feedbacksCompletedAt: Date | null;
                absenceMarked: boolean;
                absenceMarkedAt: Date | null;
                voiceSent: boolean;
                voiceSentAt: Date | null;
                textSent: boolean;
                textSentAt: Date | null;
                completedAt: Date | null;
            })[];
        };
        recentDeductions: {
            teacherId: string;
            id: string;
            createdAt: Date;
            lessonId: string | null;
            note: string | null;
            reason: import("@ilona/database").$Enums.DeductionReason;
            amount: Prisma.Decimal;
            percentage: Prisma.Decimal | null;
            appliedAt: Date;
        }[];
        statistics: {
            lessons: {
                total: number;
                completed: number;
                cancelled: number;
                scheduled: number;
            };
            compliance: {
                vocabularyRate: number;
                feedbackRate: number;
            };
            deductions: {
                count: number;
                total: number | Prisma.Decimal;
            };
            studentsCount: number;
            groupsCount: number;
        };
    }>;
    getDailyPlan(userId: string, date: Date): Promise<{
        date: Date;
        teacher: {
            id: string;
            name: string;
        };
        lessons: {
            attendanceStatus: {
                total: number;
                marked: number;
            };
            feedbackStatus: {
                total: number;
                completed: number;
            };
            group: {
                center: {
                    name: string;
                    id: string;
                };
                students: ({
                    user: {
                        id: string;
                        firstName: string;
                        lastName: string;
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
            };
            feedbacks: {
                teacherId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                lessonId: string;
                studentId: string;
                level: import("@ilona/database").$Enums.CefrLevel | null;
                rating: number | null;
                strengths: string | null;
                improvements: string | null;
                grammarTopics: string[];
                skills: string[];
                skillsNote: string | null;
                participation: number | null;
                progress: string | null;
                encouragement: string | null;
            }[];
            attendances: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                lessonId: string;
                studentId: string;
                markedById: string | null;
                isPresent: boolean;
                absenceType: import("@ilona/database").$Enums.AbsenceType | null;
                note: string | null;
                markedAt: Date;
            }[];
            status: import("@ilona/database").$Enums.LessonStatus;
            groupId: string;
            teacherId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            duration: number;
            description: string | null;
            topic: string | null;
            creationSource: import("@ilona/database").$Enums.LessonCreationSource;
            substituteTeacherId: string | null;
            scheduledAt: Date;
            vocabularySent: boolean;
            vocabularySentAt: Date | null;
            feedbacksCompleted: boolean;
            feedbacksCompletedAt: Date | null;
            absenceMarked: boolean;
            absenceMarkedAt: Date | null;
            voiceSent: boolean;
            voiceSentAt: Date | null;
            textSent: boolean;
            textSentAt: Date | null;
            completedAt: Date | null;
        }[];
    }>;
}
