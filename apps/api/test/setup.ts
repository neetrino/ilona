import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables (NODE_ENV is read-only in types, use assertion for tests)
(process.env as Record<string, string>).NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';

beforeAll(() => {
  // Global setup before all tests
});

afterAll(() => {
  // Global cleanup after all tests
});

// Mock console.log in tests to reduce noise
vi.spyOn(console, 'log').mockImplementation(() => {});


