import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { assertSafeStorageKey } from './storage-key.util';

const LOCAL_SUBDIRECTORIES = ['avatars', 'chat', 'documents', 'settings'] as const;

export function resolveLocalStoragePath(basePath?: string): string {
  return basePath ?? path.join(process.cwd(), 'uploads');
}

export function getLocalFilePath(localStoragePath: string, key: string): string {
  const safeKey = assertSafeStorageKey(key);
  const basePath = path.resolve(localStoragePath);
  const filePath = path.resolve(basePath, safeKey);
  const relativePath = path.relative(basePath, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Invalid storage key path');
  }

  return filePath;
}

export async function ensureLocalStorageDirectory(
  localStoragePath: string,
  logger?: Logger,
): Promise<void> {
  try {
    await fs.mkdir(localStoragePath, { recursive: true });
    await Promise.all(
      LOCAL_SUBDIRECTORIES.map((dir) =>
        fs.mkdir(path.join(localStoragePath, dir), { recursive: true }),
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger?.error(`Failed to create local storage directory: ${message}`);
  }
}
