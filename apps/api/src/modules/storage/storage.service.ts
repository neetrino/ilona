import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('R2_ENDPOINT');

    this.bucket = this.configService.get<string>('R2_BUCKET_NAME') || 'ilona';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      this.logger.warn('R2 credentials not configured - file uploads will fail');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  /**
   * Generate a unique key for file storage
   */
  private generateKey(folder: string, fileName: string): string {
    const ext = fileName.split('.').pop() || '';
    const uniqueName = `${uuidv4()}.${ext}`;
    return `${folder}/${uniqueName}`;
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    // Fallback to signed URL if no public URL configured
    return key;
  }

  /**
   * Upload a file directly
   */
  async upload(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder = 'uploads',
  ): Promise<UploadResult> {
    const key = this.generateKey(folder, fileName);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ContentLength: buffer.length,
        }),
      );

      this.logger.log(`File uploaded: ${key}`);

      return {
        key,
        url: this.getPublicUrl(key),
        fileName,
        fileSize: buffer.length,
        mimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error}`);
      throw error;
    }
  }

  /**
   * Generate presigned URL for client-side upload
   */
  async getPresignedUploadUrl(
    fileName: string,
    mimeType: string,
    folder = 'uploads',
    expiresIn = 3600,
  ): Promise<PresignedUrlResult> {
    const key = this.generateKey(folder, fileName);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return {
        uploadUrl,
        key,
        publicUrl: this.getPublicUrl(key),
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error}`);
      throw error;
    }
  }

  /**
   * Generate presigned URL for file download
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate download URL: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async delete(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error}`);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.upload(buffer, fileName, mimeType, 'avatars');
  }

  /**
   * Upload chat attachment
   */
  async uploadChatFile(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.upload(buffer, fileName, mimeType, 'chat');
  }

  /**
   * Upload document
   */
  async uploadDocument(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.upload(buffer, fileName, mimeType, 'documents');
  }
}
