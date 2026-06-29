import { Inject, Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import { assertS3Configured, STORAGE_CONFIG, type StorageConfig } from './storage-client.util';
import { getLocalFilePath } from './storage-local.util';
import { assertSafeStorageKey } from './storage-key.util';

@Injectable()
export class StorageDeleteService {
  private readonly logger = new Logger(StorageDeleteService.name);

  constructor(@Inject(STORAGE_CONFIG) private readonly config: StorageConfig) {}

  async delete(key: string): Promise<void> {
    const safeKey = assertSafeStorageKey(key);

    if (this.config.useLocalStorage) {
      try {
        const filePath = getLocalFilePath(this.config.localStoragePath, safeKey);
        await fs.unlink(filePath);
        this.logger.log(`File deleted from local storage: ${safeKey}`);
      } catch (error) {
        const err = error as { code?: string };
        if (err.code !== 'ENOENT') {
          this.logger.error(
            `Failed to delete file from local storage: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }
      }
      return;
    }

    assertS3Configured(this.config);

    try {
      await this.config.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
      );

      this.logger.log(`File deleted from R2: ${safeKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from R2: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
