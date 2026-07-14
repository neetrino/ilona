import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Prisma } from '@ilona/database';
export declare class FeedbackQueryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getByLesson(lessonId: string): Promise<{
        lesson: {
            id: string;
            scheduledAt: Date;
            topic: string | null;
            status: import("@ilona/database").$Enums.LessonStatus;
            notes: string | null;
        };
        studentsWithFeedback: {
            student: {
                id: string;
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            };
            feedback: ({
                student: {
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
                };
            } & {
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
            }) | null;
        }[];
    }>;
    getByStudent(studentId: string, userId: string, userRole: UserRole, params?: {
        dateFrom?: Date;
        dateTo?: Date;
        teacherId?: string;
    }): Promise<({
        teacher: {
            user: {
                id: string;
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
        };
        lesson: {
            group: {
                name: string;
                id: string;
                level: string | null;
            };
            id: string;
            scheduledAt: Date;
            feedbacksCompleted: boolean;
            absenceMarked: boolean;
            absenceMarkedAt: Date | null;
            voiceSent: boolean;
            voiceSentAt: Date | null;
            textSent: boolean;
            textSentAt: Date | null;
        };
    } & {
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
    })[]>;
}
