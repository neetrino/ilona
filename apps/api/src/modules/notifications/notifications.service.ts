import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

export type NotificationType =
  | 'ABSENCE_UNJUSTIFIED'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_OVERDUE'
  | 'FEEDBACK_MISSING'
  | 'VOCABULARY_MISSING'
  | 'LESSON_REMINDER'
  | 'WELCOME';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Notify student about unjustified absence
   */
  async notifyStudentAbsence(studentId: string, lessonId: string): Promise<void> {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          group: { select: { name: true } },
        },
      });

      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!student || !lesson) {
        this.logger.warn(`Student or lesson not found: ${studentId}, ${lessonId}`);
        return;
      }

      const lessonDate = new Date(lesson.scheduledAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await this.emailService.sendAbsenceNotification(
        student.user.email,
        `${student.user.firstName} ${student.user.lastName}`,
        lessonDate,
        student.group?.name || 'Unknown Group',
      );

      this.logger.log(`Absence notification sent to student ${studentId}`);
    } catch (error) {
      this.logger.error(`Failed to notify student about absence:`, error);
    }
  }

  /**
   * Notify student about payment reminder
   */
  async notifyPaymentReminder(paymentId: string): Promise<void> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          student: {
            include: {
              user: { select: { email: true, firstName: true, lastName: true } },
            },
          },
        },
      });

      if (!payment) {
        this.logger.warn(`Payment not found: ${paymentId}`);
        return;
      }

      const dueDate = new Date(payment.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await this.emailService.sendPaymentReminder(
        payment.student.user.email,
        `${payment.student.user.firstName} ${payment.student.user.lastName}`,
        Number(payment.amount),
        dueDate,
      );

      this.logger.log(`Payment reminder sent for payment ${paymentId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment reminder:`, error);
    }
  }

  /**
   * Notify teacher about missing feedback
   */
  async notifyTeacherFeedbackMissing(teacherId: string, lessonId: string): Promise<void> {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      });

      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          group: { select: { name: true } },
        },
      });

      if (!teacher || !lesson) {
        this.logger.warn(`Teacher or lesson not found: ${teacherId}, ${lessonId}`);
        return;
      }

      const lessonDate = new Date(lesson.scheduledAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await this.emailService.sendTeacherFeedbackReminder(
        teacher.user.email,
        `${teacher.user.firstName} ${teacher.user.lastName}`,
        `${lesson.group.name} - ${lessonDate}`,
      );

      this.logger.log(`Feedback reminder sent to teacher ${teacherId}`);
    } catch (error) {
      this.logger.error(`Failed to send feedback reminder:`, error);
    }
  }

  /**
   * Send lesson reminder to all participants
   */
  async sendLessonReminders(lessonId: string): Promise<void> {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          group: {
            include: {
              students: {
                include: {
                  user: { select: { email: true, firstName: true, lastName: true } },
                },
              },
            },
          },
          teacher: {
            include: {
              user: { select: { email: true, firstName: true, lastName: true } },
            },
          },
        },
      });

      if (!lesson) {
        this.logger.warn(`Lesson not found: ${lessonId}`);
        return;
      }

      const lessonDate = new Date(lesson.scheduledAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const lessonTime = new Date(lesson.scheduledAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Send to teacher
      await this.emailService.sendLessonReminder(
        lesson.teacher.user.email,
        `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`,
        lessonDate,
        lessonTime,
        lesson.group.name,
      );

      // Send to all students
      for (const student of lesson.group.students) {
        await this.emailService.sendLessonReminder(
          student.user.email,
          `${student.user.firstName} ${student.user.lastName}`,
          lessonDate,
          lessonTime,
          lesson.group.name,
        );
      }

      this.logger.log(`Lesson reminders sent for lesson ${lessonId}`);
    } catch (error) {
      this.logger.error(`Failed to send lesson reminders:`, error);
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true, role: true },
      });

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        return;
      }

      await this.emailService.sendWelcomeEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        user.role,
      );

      this.logger.log(`Welcome email sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email:`, error);
    }
  }

  /**
   * Process all overdue payments and send reminders
   */
  async processOverduePayments(): Promise<number> {
    const overduePayments = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
    });

    let sent = 0;
    for (const payment of overduePayments) {
      await this.notifyPaymentReminder(payment.id);
      
      // Update status to OVERDUE
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'OVERDUE' },
      });
      
      sent++;
    }

    this.logger.log(`Processed ${sent} overdue payments`);
    return sent;
  }
}
