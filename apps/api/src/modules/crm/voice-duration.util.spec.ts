import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { parseDurationSecForVoice, MAX_VOICE_DURATION_SEC } from './voice-duration.util';

describe('parseDurationSecForVoice', () => {
  it('returns undefined for absent or empty loose', () => {
    expect(parseDurationSecForVoice(undefined, 'loose')).toBeUndefined();
    expect(parseDurationSecForVoice(null, 'loose')).toBeUndefined();
    expect(parseDurationSecForVoice('', 'loose')).toBeUndefined();
    expect(parseDurationSecForVoice('  ', 'loose')).toBeUndefined();
  });

  it('parses valid integers loose and strict', () => {
    expect(parseDurationSecForVoice(0, 'loose')).toBe(0);
    expect(parseDurationSecForVoice(120, 'strict')).toBe(120);
    expect(parseDurationSecForVoice('45', 'loose')).toBe(45);
  });

  it('loose mode ignores invalid values', () => {
    expect(parseDurationSecForVoice('abc', 'loose')).toBeUndefined();
    expect(parseDurationSecForVoice(1.5, 'loose')).toBeUndefined();
    expect(parseDurationSecForVoice(-1, 'loose')).toBeUndefined();
    expect(parseDurationSecForVoice(MAX_VOICE_DURATION_SEC + 1, 'loose')).toBeUndefined();
  });

  it('strict mode throws on invalid values', () => {
    expect(() => parseDurationSecForVoice('abc', 'strict')).toThrow(BadRequestException);
    expect(() => parseDurationSecForVoice(1.5, 'strict')).toThrow(BadRequestException);
    expect(() => parseDurationSecForVoice(-1, 'strict')).toThrow(BadRequestException);
    expect(() => parseDurationSecForVoice(MAX_VOICE_DURATION_SEC + 1, 'strict')).toThrow(
      BadRequestException,
    );
  });
});
