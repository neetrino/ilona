import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';
import type { SubmitCvApplicationDto } from './dto/submit-cv-application.dto';

const CV_MAX_BYTES = 5 * 1024 * 1024;
const CV_MAX_FILES = 2;
const CV_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isAllowedCv(file: Express.Multer.File): boolean {
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  const isAllowedExtension = extension === 'pdf' || extension === 'doc' || extension === 'docx';
  const isAllowedMime = CV_MIME_TYPES.has(file.mimetype) || file.mimetype === '';
  return isAllowedExtension && isAllowedMime;
}

function assertValidCv(file: Express.Multer.File): void {
  if (!file.buffer?.length) {
    throw new BadRequestException('Please attach your CV.');
  }
  if (!isAllowedCv(file)) {
    throw new BadRequestException('Please upload a PDF, DOC, or DOCX file.');
  }
  if (file.size > CV_MAX_BYTES) {
    throw new BadRequestException('File must be 5 MB or smaller.');
  }
}

@Injectable()
export class CvApplicationsService {
  private readonly logger = new Logger(CvApplicationsService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async submit(
    dto: SubmitCvApplicationDto,
    files: Express.Multer.File[] | undefined,
  ): Promise<{ ok: true }> {
    const cvFiles = (files ?? []).filter((file) => Boolean(file?.buffer?.length));

    if (cvFiles.length === 0) {
      throw new BadRequestException('Please attach your CV.');
    }

    if (cvFiles.length > CV_MAX_FILES) {
      throw new BadRequestException('You can attach up to 2 files.');
    }

    for (const file of cvFiles) {
      assertValidCv(file);
    }

    const to = this.configService.get<string>('EMAIL_TO')?.trim();
    if (!to) {
      this.logger.error('EMAIL_TO is not configured');
      throw new InternalServerErrorException('Application email is not configured.');
    }

    const fullName = `${dto.firstName} ${dto.lastName}`.trim();
    const message = dto.message?.trim() || '—';
    const fileNames = cvFiles.map((file) => file.originalname);
    const safe = {
      fullName: escapeHtml(fullName),
      email: escapeHtml(dto.email),
      phone: escapeHtml(dto.phone),
      message: escapeHtml(message).replaceAll('\n', '<br />'),
      fileNamesHtml: fileNames.map((name) => `<li>${escapeHtml(name)}</li>`).join(''),
    };

    const sent = await this.emailService.send({
      to,
      replyTo: dto.email,
      subject: `CV Application — ${fullName}`,
      text: [
        'New CV application',
        `Name: ${fullName}`,
        `Email: ${dto.email}`,
        `Phone: ${dto.phone}`,
        `Message: ${message}`,
        `CV files: ${fileNames.join(', ')}`,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #101828;">
          <h2 style="margin: 0 0 16px;">New CV Application</h2>
          <p><strong>Name:</strong> ${safe.fullName}</p>
          <p><strong>Email:</strong> ${safe.email}</p>
          <p><strong>Phone:</strong> ${safe.phone}</p>
          <p><strong>Cover letter:</strong></p>
          <p>${safe.message}</p>
          <p><strong>CV files:</strong></p>
          <ul>${safe.fileNamesHtml}</ul>
        </div>
      `,
      attachments: cvFiles.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype || undefined,
      })),
    });

    if (!sent) {
      throw new InternalServerErrorException('Failed to send application. Please try again later.');
    }

    return { ok: true };
  }
}
