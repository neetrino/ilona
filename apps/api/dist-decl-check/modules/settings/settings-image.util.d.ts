import { Response } from 'express';
export declare function cacheBusterFromKey(fileKey: string): string;
export declare function contentTypeFromKey(fileKey: string): string;
export declare function createImageValidationExceptionFactory(maxSizeMb: number): (error: string) => never;
export declare function sendImageResponse(res: Response, fileBuffer: Buffer, contentType: string): void;
