import { Inject, Injectable, Logger } from '@nestjs/common';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import {
  assertS3Configured,
  STORAGE_CONFIG,
  type StorageConfig,
} from './storage-client.util';
import { getLocalFilePath } from './storage-local.util';
import { assertSafeStorageKey } from './storage-key.util';
import { StorageUploadService } from './storage-upload.service';

@Injectable()
export class StorageReadService {
  private readonly logger = new Logger(StorageReadService.name);

  constructor(
    @Inject(STORAGE_CONFIG) private readonly config: StorageConfig,
    private readonly uploadService: StorageUploadService,
  ) {}

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const safeKey = assertSafeStorageKey(key);

    if (this.config.useLocalStorage) {
      return this.uploadService.getPublicUrl(safeKey);
    }

    assertS3Configured(this.config);

    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: safeKey,
      });

      return await getSignedUrl(this.config.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(
        `Failed to generate download URL: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getFile(key: string): Promise<Buffer | null> {
    const safeKey = assertSafeStorageKey(key);

    if (this.config.useLocalStorage) {
      try {
        const filePath = getLocalFilePath(this.config.localStoragePath, safeKey);
        return await fs.readFile(filePath);
      } catch (error) {
        this.logger.error(
          `Failed to read file from local storage: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    }

    if (!this.config.s3Client) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: safeKey,
      });

      const response = await this.config.s3Client.send(command);

      if (!response.Body) {
        this.logger.warn(`File found in R2 but has no body: ${safeKey}`);
        return null;
      }

      const chunks: Uint8Array[] = [];
      const body = response.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of body) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (err: unknown) {
      const error = err as {
        name?: string;
        message?: string;
        $metadata?: { httpStatusCode?: number };
      };
      if (
        error.name === 'NoSuchKey' ||
        error.$metadata?.httpStatusCode === 404 ||
        (error.message &&
          (error.message.includes('does not exist') || error.message.includes('NoSuchKey')))
      ) {
        this.logger.warn(`File not found in R2: ${safeKey}`);
      } else {
        this.logger.error(
          `Failed to get file from R2: ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err.stack : undefined,
        );
      }
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    const safeKey = assertSafeStorageKey(key);

    if (this.config.useLocalStorage) {
      try {
        const filePath = getLocalFilePath(this.config.localStoragePath, safeKey);
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    }

    if (!this.config.s3Client) {
      return false;
    }

    try {
      await this.config.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
