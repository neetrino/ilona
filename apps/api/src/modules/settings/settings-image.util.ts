import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { IMAGE_CONTENT_TYPE_MAP } from './settings-controller.constants';

export function cacheBusterFromKey(fileKey: string): string {
  return encodeURIComponent(fileKey.split('/').pop() || fileKey);
}

export function contentTypeFromKey(fileKey: string): string {
  const ext = path.extname(fileKey).toLowerCase();
  return IMAGE_CONTENT_TYPE_MAP[ext] || 'image/png';
}

export function createImageValidationExceptionFactory(maxSizeMb: number) {
  return (error: string) => {
    if (error.includes('File is too large')) {
      throw new PayloadTooLargeException(
        `File size exceeds the maximum allowed size of ${maxSizeMb}MB`,
      );
    }
    if (error.includes('File type')) {
      throw new UnsupportedMediaTypeException(
        'Invalid file type. Only PNG, JPG, WEBP, and SVG images are allowed.',
      );
    }
    throw new BadRequestException(`File validation failed: ${error}`);
  };
}

export function sendImageResponse(res: Response, fileBuffer: Buffer, contentType: string): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
  res.send(fileBuffer);
}
