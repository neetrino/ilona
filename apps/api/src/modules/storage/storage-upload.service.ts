import { Inject, Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  assertS3Configured,
  getPublicUrlFromConfig,
  STORAGE_CONFIG,
  type StorageConfig,
} from './storage-client.util';
import { getLocalFilePath } from './storage-local.util';
import type { PresignedUrlResult, UploadResult } from './storage.types';

@Injectable()
export class StorageUploadService {
  private readonly logger = new Logger(StorageUploadService.name);

  constructor(
    @Inject(STORAGE_CONFIG) private readonly config: StorageConfig,
    private readonly configService: ConfigService,
  ) {}

  getPublicUrl(key: string): string {
    return getPublicUrlFromConfig(this.config, this.configService, key);
  }

  async upload(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder = 'uploads',
  ): Promise<UploadResult> {
    const key = this.generateKey(folder, fileName);

    if (this.config.useLocalStorage) {
      try {
        const filePath = getLocalFilePath(this.config.localStoragePath, key);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);

        this.logger.log(`File uploaded to local storage: ${String(key)}`);

        return {
          key,
          url: this.getPublicUrl(key),
          fileName,
          fileSize: buffer.length,
          mimeType,
        };
      } catch (error) {
        this.logger.error(
          `Failed to upload file to local storage: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw error;
      }
    }

    assertS3Configured(this.config);

    try {
      await this.config.s3Client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ContentLength: buffer.length,
        }),
      );

      this.logger.log(`File uploaded to R2: ${String(key)}`);

      return {
        key,
        url: this.getPublicUrl(key),
        fileName,
        fileSize: buffer.length,
        mimeType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to R2: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getPresignedUploadUrl(
    fileName: string,
    mimeType: string,
    folder = 'uploads',
    expiresIn = 3600,
  ): Promise<PresignedUrlResult> {
    const key = this.generateKey(folder, fileName);

    if (this.config.useLocalStorage) {
      return {
        uploadUrl: this.getPublicUrl(key),
        key,
        publicUrl: this.getPublicUrl(key),
      };
    }

    assertS3Configured(this.config);

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ContentType: mimeType,
      });

      const uploadUrl = await getSignedUrl(this.config.s3Client, command, { expiresIn });

      return {
        uploadUrl,
        key,
        publicUrl: this.getPublicUrl(key),
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async uploadAvatar(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    const processedBuffer = await this.resizeImage(buffer);
    const base64String = processedBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64String}`;
    const key = this.generateKey('avatars', fileName);

    this.logger.log(
      `Avatar converted to base64, original: ${buffer.length} bytes, processed: ${processedBuffer.length} bytes, base64: ${base64String.length} chars`,
    );

    if (base64String.length > 10 * 1024 * 1024) {
      this.logger.warn(
        `Base64 string is very large (${Math.round(base64String.length / 1024 / 1024)}MB). Consider reducing image size.`,
      );
    }

    return {
      key,
      url: dataUrl,
      fileName,
      fileSize: processedBuffer.length,
      mimeType,
    };
  }

  /**
   * RETENTION: Chat files are stored permanently. Do not add object lifecycle rules,
   * expiration metadata, or TTL for the chat/ folder.
   */
  async uploadChatFile(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.upload(buffer, fileName, mimeType, 'chat');
  }

  async uploadDocument(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.upload(buffer, fileName, mimeType, 'documents');
  }

  private generateKey(folder: string, fileName: string): string {
    const ext = fileName.split('.').pop() || '';
    const uniqueName = `${uuidv4()}.${ext}`;
    return `${folder}/${uniqueName}`;
  }

  private resizeImage(buffer: Buffer): Promise<Buffer> {
    if (buffer.length < 500 * 1024) {
      return Promise.resolve(buffer);
    }
    this.logger.warn(
      `Large image detected (${buffer.length} bytes). Consider installing sharp for automatic resizing.`,
    );
    return Promise.resolve(buffer);
  }
}
