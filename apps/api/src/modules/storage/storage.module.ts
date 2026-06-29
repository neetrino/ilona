import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageUploadService } from './storage-upload.service';
import { StorageReadService } from './storage-read.service';
import { StorageDeleteService } from './storage-delete.service';
import { StorageController } from './storage.controller';
import { createStorageConfig, STORAGE_CONFIG } from './storage-client.util';

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_CONFIG,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('StorageService');
        return createStorageConfig(configService, logger);
      },
      inject: [ConfigService],
    },
    StorageService,
    StorageUploadService,
    StorageReadService,
    StorageDeleteService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
