import { BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@ilona/database';
import type { ConvertibleToNumber } from './settings.types';

const logger = new Logger('SettingsUtil');

export const DASHBOARD_BANNER_TITLE_MAX = 150;
export const DASHBOARD_BANNER_SUBTITLE_MAX = 400;

export function extractKeyFromUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (!value.includes('://') && !value.startsWith('/api/')) {
    return value;
  }

  try {
    const storageFileMatch = value.match(/\/storage\/file\/(.+)$/);
    if (storageFileMatch) {
      return decodeURIComponent(storageFileMatch[1]);
    }

    const url = new URL(value);
    const pathname = url.pathname;
    if (pathname.startsWith('/')) {
      const key = pathname.substring(1);
      if (key.match(/^(settings|avatars|chat|documents)\//)) {
        return key;
      }
    }
  } catch {
    const parts = value.split('/');
    const settingsIndex = parts.findIndex((p) => p === 'settings');
    if (settingsIndex >= 0 && settingsIndex < parts.length - 1) {
      return parts.slice(settingsIndex).join('/');
    }
  }

  logger.warn(`Could not extract key from logo URL: ${value}`);
  return null;
}

export function normalizeDashboardBannerText(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  if (value == null) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw new BadRequestException(
      `Dashboard banner text must be at most ${maxLength} characters.`,
    );
  }

  return trimmed;
}

export function convertToNumber(value: ConvertibleToNumber, fallbackValue = 0): number {
  if (value == null) return fallbackValue;
  if (typeof value === 'number') return value;
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  const num = Number(value);
  return Number.isNaN(num) ? fallbackValue : num;
}
