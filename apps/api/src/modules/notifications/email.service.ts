import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'Ilona English <noreply@ilona.edu>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not configured - emails will be logged only');
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    // If Resend is not configured, just log
    if (!this.resend) {
      const toDisplay = Array.isArray(to) ? to.join(', ') : to;
      this.logger.log(`[EMAIL MOCK] To: ${toDisplay}, Subject: ${subject}`);
      this.logger.debug(`[EMAIL MOCK] HTML: ${html.substring(0, 200)}...`);
      return true;
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      });

      const toDisplay = Array.isArray(to) ? to.join(', ') : to;
      this.logger.log(`Email sent successfully to ${toDisplay}, id: ${response.data?.id}`);
      return true;
    } catch (error) {
      const toDisplay = Array.isArray(to) ? to.join(', ') : to;
      this.logger.error(`Failed to send email to ${toDisplay}:`, error);
      return false;
    }
  }

  // Pre-built email templates
  async sendWelcomeEmail(to: string, name: string, role: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Welcome to Ilona English Center!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Ilona English Center!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Your ${role.toLowerCase()} account has been created successfully.</p>
              <p>You can now log in to access your dashboard and start your English learning journey!</p>
              <a href="${this.configService.get('FRONTEND_URL') || 'https://ilona.edu'}/login" class="button">
                Log In Now
              </a>
              <p style="margin-top: 20px;">If you have any questions, feel free to contact us.</p>
              <p>Best regards,<br>Ilona English Center Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Ilona English Center. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendAbsenceNotification(
    to: string,
    studentName: string,
    lessonDate: string,
    groupName: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: 'Missed Lesson Notification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fcd34d; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⚠️ Missed Lesson</h2>
            </div>
            <div class="content">
              <p>Hello <strong>${studentName}</strong>,</p>
              <div class="alert">
                <p>We noticed you missed your lesson on <strong>${lessonDate}</strong> in group <strong>${groupName}</strong>.</p>
              </div>
              <p>Everything okay? If you had to miss for a valid reason, please contact your teacher or admin.</p>
              <p>Regular attendance is important for your learning progress!</p>
              <p>Best regards,<br>Ilona English Center</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendPaymentReminder(
    to: string,
    studentName: string,
    amount: number,
    dueDate: string,
  ): Promise<boolean> {
    const formattedAmount = new Intl.NumberFormat('hy-AM', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    return this.send({
      to,
      subject: 'Payment Reminder',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fecaca; }
            .amount { font-size: 32px; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>💳 Payment Reminder</h2>
            </div>
            <div class="content">
              <p>Hello <strong>${studentName}</strong>,</p>
              <p>This is a reminder that your payment is due:</p>
              <div class="amount">${formattedAmount}</div>
              <p style="text-align: center;">Due date: <strong>${dueDate}</strong></p>
              <p>Please make your payment to continue your English lessons without interruption.</p>
              <p>Best regards,<br>Ilona English Center</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendTeacherFeedbackReminder(
    to: string,
    teacherName: string,
    lessonInfo: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: 'Reminder: Submit Lesson Feedback',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f5f3ff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd6fe; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📝 Feedback Reminder</h2>
            </div>
            <div class="content">
              <p>Hello <strong>${teacherName}</strong>,</p>
              <p>You have pending feedback to submit for:</p>
              <div class="warning">
                <strong>${lessonInfo}</strong>
              </div>
              <p>Please remember to:</p>
              <ul>
                <li>Mark attendance for all students</li>
                <li>Submit feedback for each student</li>
                <li>Send vocabulary message in group chat</li>
              </ul>
              <p>Completing these tasks is required to finalize the lesson and receive payment.</p>
              <p>Best regards,<br>Ilona English Center</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendLessonReminder(
    to: string,
    name: string,
    lessonDate: string,
    lessonTime: string,
    groupName: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: 'Upcoming Lesson Reminder',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f0f9ff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #bae6fd; }
            .lesson-info { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .time { font-size: 24px; font-weight: bold; color: #0284c7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📅 Lesson Reminder</h2>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>This is a reminder about your upcoming lesson:</p>
              <div class="lesson-info">
                <p><strong>Group:</strong> ${groupName}</p>
                <p><strong>Date:</strong> ${lessonDate}</p>
                <p class="time">Time: ${lessonTime}</p>
              </div>
              <p>See you there!</p>
              <p>Best regards,<br>Ilona English Center</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
