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
import * as fs from 'fs/promises';
import * as path from 'path';

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
  private readonly s3Client: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly useLocalStorage: boolean;
  private readonly localStoragePath: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('R2_ENDPOINT');

    this.bucket = this.configService.get<string>('R2_BUCKET_NAME') || 'ilona';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    // Check if R2 is configured
    const isConfigured = !!(accessKeyId && secretAccessKey && (endpoint || accountId));

    if (!isConfigured) {
      this.useLocalStorage = true;
      this.s3Client = null;
      // Use local storage in development when R2 is not configured
      this.localStoragePath = path.join(process.cwd(), 'uploads');
      this.logger.warn('R2 credentials not configured - using local file storage');
      this.logger.log(`Local storage path: ${this.localStoragePath}`);
      
      // Ensure uploads directory exists
      this.ensureLocalStorageDirectory();
    } else {
      this.useLocalStorage = false;
      this.localStoragePath = '';
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKeyId!,
          secretAccessKey: secretAccessKey!,
        },
      });
      this.logger.log('R2 storage configured');
    }
  }

  /**
   * Ensure local storage directory exists
   */
  private async ensureLocalStorageDirectory(): Promise<void> {
    if (!this.useLocalStorage) return;

    try {
      await fs.mkdir(this.localStoragePath, { recursive: true });
      // Create subdirectories
      await fs.mkdir(path.join(this.localStoragePath, 'avatars'), { recursive: true });
      await fs.mkdir(path.join(this.localStoragePath, 'chat'), { recursive: true });
      await fs.mkdir(path.join(this.localStoragePath, 'documents'), { recursive: true });
      await fs.mkdir(path.join(this.localStoragePath, 'settings'), { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create local storage directory: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    if (this.useLocalStorage) {
      // For local storage, return a path that can be served by the API
      const apiUrl = this.configService.get<string>('API_URL', 'http://localhost:4000');
      const apiPrefix = this.configService.get<string>('API_PREFIX', 'api');
      return `${apiUrl}/${apiPrefix}/storage/file/${encodeURIComponent(key)}`;
    }
    
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

    if (this.useLocalStorage) {
      // Use local file storage
      try {
        const filePath = path.join(this.localStoragePath, key);
        const dirPath = path.dirname(filePath);
        
        // Ensure directory exists
        await fs.mkdir(dirPath, { recursive: true });
        
        // Write file
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

    // Use R2 storage
    if (!this.s3Client) {
      throw new Error('File storage is not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT environment variables.');
    }

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

    if (this.useLocalStorage) {
      // For local storage, return the public URL directly (no presigned URL needed)
      return {
        uploadUrl: this.getPublicUrl(key),
        key,
        publicUrl: this.getPublicUrl(key),
      };
    }

    if (!this.s3Client) {
      throw new Error('File storage is not configured');
    }

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
      this.logger.error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Generate presigned URL for file download
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.useLocalStorage) {
      // For local storage, return the public URL directly
      return this.getPublicUrl(key);
    }

    if (!this.s3Client) {
      throw new Error('File storage is not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(
        `Failed to generate download URL: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async delete(key: string): Promise<void> {
    if (this.useLocalStorage) {
      try {
        const filePath = path.join(this.localStoragePath, key);
        await fs.unlink(filePath);
        this.logger.log(`File deleted from local storage: ${String(key)}`);
      } catch (error) {
        // Ignore if file doesn't exist
        if ((error as any)?.code !== 'ENOENT') {
          this.logger.error(
            `Failed to delete file from local storage: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }
      }
      return;
    }

    if (!this.s3Client) {
      throw new Error('File storage is not configured');
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      this.logger.log(`File deleted from R2: ${String(key)}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from R2: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get a file buffer
   */
  async getFile(key: string): Promise<Buffer | null> {
    if (this.useLocalStorage) {
      try {
        const filePath = path.join(this.localStoragePath, key);
        return await fs.readFile(filePath);
      } catch (error) {
        this.logger.error(
          `Failed to read file from local storage: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    }

    if (!this.s3Client) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        this.logger.warn(`File found in R2 but has no body: ${key}`);
        return null;
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error: any) {
      // Check if it's a "not found" error
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404 || 
          error.message?.includes('does not exist') || error.message?.includes('NoSuchKey')) {
        this.logger.warn(`File not found in R2: ${key}`);
      } else {
        this.logger.error(
          `Failed to get file from R2: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
      return null;
    }
  }

  /**
   * Check if file exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.useLocalStorage) {
      try {
        const filePath = path.join(this.localStoragePath, key);
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    }

    if (!this.s3Client) {
      return false;
    }

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
   * Resize and compress image buffer (placeholder for future implementation)
   * TODO: Install sharp for proper image resizing: npm install sharp
   */
  private async resizeImage(buffer: Buffer): Promise<Buffer> {
    // For now, we'll use a simple approach - if image is too large, we'll need to resize
    // Since we don't have sharp installed, we'll limit the size by reducing quality
    // In production, consider installing sharp for proper image processing
    
    // If buffer is already small enough (< 500KB), return as is
    if (buffer.length < 500 * 1024) {
      return buffer;
    }
    
    // For larger images, we need to resize
    // Since we don't have image processing library, we'll just return the buffer
    // and let the client handle compression
    // TODO: Install sharp for proper image resizing: npm install sharp
    this.logger.warn(`Large image detected (${buffer.length} bytes). Consider installing sharp for automatic resizing.`);
    
    return buffer;
  }

  /**
   * Upload avatar image - stores as base64 in database
   */
  async uploadAvatar(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    // Resize image if needed to reduce base64 size
    const processedBuffer = await this.resizeImage(buffer);
    
    // Convert buffer to base64
    const base64String = processedBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64String}`;
    
    // Generate a unique key for reference
    const key = this.generateKey('avatars', fileName);
    
    this.logger.log(`Avatar converted to base64, original: ${buffer.length} bytes, processed: ${processedBuffer.length} bytes, base64: ${base64String.length} chars`);
    
    // Warn if base64 is still very large (> 10MB)
    if (base64String.length > 10 * 1024 * 1024) {
      this.logger.warn(`Base64 string is very large (${Math.round(base64String.length / 1024 / 1024)}MB). Consider reducing image size.`);
    }
    
    return {
      key,
      url: dataUrl, // Return data URL instead of file URL
      fileName,
      fileSize: processedBuffer.length,
      mimeType,
    };
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
