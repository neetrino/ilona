import { ConfigService } from '@nestjs/config';
export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private configService;
    private readonly logger;
    private resend;
    private fromEmail;
    constructor(configService: ConfigService);
    send(options: EmailOptions): Promise<boolean>;
    sendWelcomeEmail(to: string, name: string, role: string): Promise<boolean>;
    sendAbsenceNotification(to: string, studentName: string, lessonDate: string, groupName: string): Promise<boolean>;
    sendPaymentReminder(to: string, studentName: string, amount: number, dueDate: string): Promise<boolean>;
    sendTeacherFeedbackReminder(to: string, teacherName: string, lessonInfo: string): Promise<boolean>;
    sendLessonReminder(to: string, name: string, lessonDate: string, lessonTime: string, groupName: string): Promise<boolean>;
}
