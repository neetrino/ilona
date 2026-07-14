import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
export type NotificationType = 'ABSENCE_UNJUSTIFIED' | 'PAYMENT_REMINDER' | 'PAYMENT_OVERDUE' | 'FEEDBACK_MISSING' | 'VOCABULARY_MISSING' | 'LESSON_REMINDER' | 'WELCOME';
export declare class NotificationsService {
    private prisma;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    notifyStudentAbsence(studentId: string, lessonId: string): Promise<void>;
    notifyPaymentReminder(paymentId: string): Promise<void>;
    notifyTeacherFeedbackMissing(teacherId: string, lessonId: string): Promise<void>;
    sendLessonReminders(lessonId: string): Promise<void>;
    sendWelcomeEmail(userId: string): Promise<void>;
    processOverduePayments(): Promise<number>;
}
