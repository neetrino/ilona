import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '@nestjs/common';

const LOCAL_SUBDIRECTORIES = ['avatars', 'chat', 'documents', 'settings'] as const;

export function resolveLocalStoragePath(basePath?: string): string {
  return basePath ?? path.join(process.cwd(), 'uploads');
}

export function getLocalFilePath(localStoragePath: string, key: string): string {
  return path.join(localStoragePath, key);
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
