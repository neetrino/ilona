import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';
import { StorageService } from '../storage/storage.service';
import {
  buildCvApplicationEmailHtml,
  buildCvApplicationEmailText,
  type CvApplicationEmailFile,
} from './cv-application-email.template';
import type { SubmitCvApplicationDto } from './dto/submit-cv-application.dto';

const CV_MAX_BYTES = 5 * 1024 * 1024;
const CV_MAX_FILES = 2;
/** Longest practical signed URL lifetime for S3-compatible storage (7 days). */
const CV_DOWNLOAD_URL_TTL_SEC = 7 * 24 * 60 * 60;
const CV_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

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
    private readonly storageService: StorageService,
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

    const emailFiles = await this.uploadCvFiles(cvFiles);
    const fullName = `${dto.firstName} ${dto.lastName}`.trim();
    const message = dto.message?.trim() || '—';
    const emailPayload = {
      fullName,
      email: dto.email,
      phone: dto.phone,
      message,
      files: emailFiles,
    };

    const sent = await this.emailService.send({
      to,
      replyTo: dto.email,
      subject: `CV Application — ${fullName}`,
      text: buildCvApplicationEmailText(emailPayload),
      html: buildCvApplicationEmailHtml(emailPayload),
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

  private async uploadCvFiles(files: Express.Multer.File[]): Promise<CvApplicationEmailFile[]> {
    const uploaded: CvApplicationEmailFile[] = [];

    for (const file of files) {
      try {
        const result = await this.storageService.upload(
          file.buffer,
          file.originalname,
          file.mimetype || 'application/octet-stream',
          'cv-applications',
        );

        let url = result.url;
        try {
          url = await this.storageService.getPresignedDownloadUrl(
            result.key,
            CV_DOWNLOAD_URL_TTL_SEC,
          );
        } catch (error) {
          this.logger.warn(
            `Using public CV URL for ${file.originalname}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }

        uploaded.push({ name: file.originalname, url });
      } catch (error) {
        this.logger.error(
          `Failed to store CV file ${file.originalname}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        throw new InternalServerErrorException('Failed to store CV file. Please try again later.');
      }
    }

    return uploaded;
  }
}
