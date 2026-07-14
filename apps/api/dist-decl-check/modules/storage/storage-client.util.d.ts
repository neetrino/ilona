import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
export declare const STORAGE_CONFIG: unique symbol;
export interface StorageConfig {
    s3Client: S3Client | null;
    bucket: string;
    publicUrl: string;
    useLocalStorage: boolean;
    localStoragePath: string;
}
export declare function createStorageConfig(configService: ConfigService, logger: Logger): StorageConfig;
export declare function getPublicUrlFromConfig(config: StorageConfig, configService: ConfigService, key: string): string;
export declare function assertS3Configured(config: StorageConfig): asserts config is StorageConfig & {
    s3Client: S3Client;
};
