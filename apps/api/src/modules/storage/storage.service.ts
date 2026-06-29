import { Injectable } from '@nestjs/common';
import { StorageDeleteService } from './storage-delete.service';
import { StorageReadService } from './storage-read.service';
import { StorageUploadService } from './storage-upload.service';
import type { PresignedUrlResult, UploadResult } from './storage.types';

export type { UploadResult, PresignedUrlResult } from './storage.types';

/** Facade for storage — delegates to upload, read, and delete services. */
@Injectable()
export class StorageService {
  constructor(
    private readonly uploadService: StorageUploadService,
    private readonly readService: StorageReadService,
    private readonly deleteService: StorageDeleteService,
  ) {}

  getPublicUrl(key: string): string {
    return this.uploadService.getPublicUrl(key);
  }

  upload(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder = 'uploads',
  ): Promise<UploadResult> {
    return this.uploadService.upload(buffer, fileName, mimeType, folder);
  }

  getPresignedUploadUrl(
    fileName: string,
    mimeType: string,
    folder = 'uploads',
    expiresIn = 3600,
  ): Promise<PresignedUrlResult> {
    return this.uploadService.getPresignedUploadUrl(fileName, mimeType, folder, expiresIn);
  }

  getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.readService.getPresignedDownloadUrl(key, expiresIn);
  }

  delete(key: string): Promise<void> {
    return this.deleteService.delete(key);
  }

  getFile(key: string): Promise<Buffer | null> {
    return this.readService.getFile(key);
  }

  exists(key: string): Promise<boolean> {
    return this.readService.exists(key);
  }

  uploadAvatar(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.uploadService.uploadAvatar(buffer, fileName, mimeType);
  }

  uploadChatFile(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.uploadService.uploadChatFile(buffer, fileName, mimeType);
  }

  uploadDocument(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    return this.uploadService.uploadDocument(buffer, fileName, mimeType);
  }
}
