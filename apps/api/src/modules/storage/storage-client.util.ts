import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { ensureLocalStorageDirectory, resolveLocalStoragePath } from './storage-local.util';

export const STORAGE_CONFIG = Symbol('STORAGE_CONFIG');

export interface StorageConfig {
  s3Client: S3Client | null;
  bucket: string;
  publicUrl: string;
  useLocalStorage: boolean;
  localStoragePath: string;
}

export function createStorageConfig(
  configService: ConfigService,
  logger: Logger,
): StorageConfig {
  const accountId = configService.get<string>('R2_ACCOUNT_ID');
  const accessKeyId = configService.get<string>('R2_ACCESS_KEY_ID');
  const secretAccessKey = configService.get<string>('R2_SECRET_ACCESS_KEY');
  const endpoint = configService.get<string>('R2_ENDPOINT');

  const bucket = configService.get<string>('R2_BUCKET_NAME') || 'ilona';
  const publicUrl = configService.get<string>('R2_PUBLIC_URL') || '';
  const isConfigured = !!(accessKeyId && secretAccessKey && (endpoint || accountId));

  if (!isConfigured) {
    const localStoragePath = resolveLocalStoragePath();
    logger.warn('R2 credentials not configured - using local file storage');
    logger.log(`Local storage path: ${localStoragePath}`);
    void ensureLocalStorageDirectory(localStoragePath, logger);

    return {
      s3Client: null,
      bucket,
      publicUrl,
      useLocalStorage: true,
      localStoragePath,
    };
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  logger.log('R2 storage configured');

  return {
    s3Client,
    bucket,
    publicUrl,
    useLocalStorage: false,
    localStoragePath: '',
  };
}

export function getPublicUrlFromConfig(
  config: StorageConfig,
  configService: ConfigService,
  key: string,
): string {
  if (config.useLocalStorage) {
    const apiUrl = configService.get<string>('API_URL', 'http://localhost:4000');
    const apiPrefix = configService.get<string>('API_PREFIX', 'api');
    return `${apiUrl}/${apiPrefix}/storage/file/${encodeURIComponent(key)}`;
  }

  if (config.publicUrl) {
    return `${config.publicUrl}/${key}`;
  }

  return key;
}

export function assertS3Configured(config: StorageConfig): asserts config is StorageConfig & {
  s3Client: S3Client;
} {
  if (!config.s3Client) {
    throw new Error(
      'File storage is not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT environment variables.',
    );
  }
}
