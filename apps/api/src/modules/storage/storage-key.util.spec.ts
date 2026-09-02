import { describe, expect, it } from 'vitest';
import {
  assertSafeStorageKey,
  extractStorageKeyFromProxyUrl,
  InvalidStorageKeyError,
} from './storage-key.util';

describe('storage-key.util', () => {
  describe('assertSafeStorageKey', () => {
    it('accepts allowed nested keys', () => {
      expect(assertSafeStorageKey('chat/voice/file.webm')).toBe('chat/voice/file.webm');
      expect(
        assertSafeStorageKey('crm/recordings/7197f24e-c97d-437e-a4af-88e950c50265.m4a'),
      ).toBe('crm/recordings/7197f24e-c97d-437e-a4af-88e950c50265.m4a');
    });

    it('rejects path traversal', () => {
      expect(() => assertSafeStorageKey('../etc/passwd')).toThrow(InvalidStorageKeyError);
      expect(() => assertSafeStorageKey('chat/../../secret.txt')).toThrow(InvalidStorageKeyError);
    });

    it('rejects unknown prefixes', () => {
      expect(() => assertSafeStorageKey('uploads/file.txt')).toThrow(InvalidStorageKeyError);
    });
  });

  describe('extractStorageKeyFromProxyUrl', () => {
    it('extracts key from valid URL pathname', () => {
      expect(extractStorageKeyFromProxyUrl('https://pub.example.r2.dev/chat/voice/file.webm')).toBe(
        'chat/voice/file.webm',
      );
    });

    it('extracts key from fallback path without regex', () => {
      expect(extractStorageKeyFromProxyUrl('not-a-url/chat/voice/file.webm')).toBe(
        'chat/voice/file.webm',
      );
    });

    it('rejects invalid URLs', () => {
      expect(() => extractStorageKeyFromProxyUrl('not-a-url/unknown/file.webm')).toThrow(
        InvalidStorageKeyError,
      );
    });
  });
});
