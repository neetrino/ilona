import { BadRequestException } from '@nestjs/common';

/** Max recording duration stored on attachment (24 hours). */
export const MAX_VOICE_DURATION_SEC = 86400;

/**
 * Parse optional duration from multipart / JSON.
 * loose: invalid values become undefined; strict: invalid values throw BadRequestException.
 */
export function parseDurationSecForVoice(
  raw: unknown,
  mode: 'loose' | 'strict',
): number | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw === 'string' && raw.trim() === '') {
    return undefined;
  }
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (
    !Number.isFinite(n) ||
    !Number.isInteger(n) ||
    n < 0 ||
    n > MAX_VOICE_DURATION_SEC
  ) {
    if (mode === 'strict') {
      throw new BadRequestException(
        `durationSec must be an integer from 0 to ${MAX_VOICE_DURATION_SEC} seconds`,
      );
    }
    return undefined;
  }
  return n;
}
