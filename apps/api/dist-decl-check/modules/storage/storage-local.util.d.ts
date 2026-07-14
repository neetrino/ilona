import { Logger } from '@nestjs/common';
export declare function resolveLocalStoragePath(basePath?: string): string;
export declare function getLocalFilePath(localStoragePath: string, key: string): string;
export declare function ensureLocalStorageDirectory(localStoragePath: string, logger?: Logger): Promise<void>;
