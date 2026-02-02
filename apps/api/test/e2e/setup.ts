import { beforeAll, afterAll, vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-e2e';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.API_PORT = '4001'; // Different port for e2e tests

beforeAll(async () => {
  // Setup before all e2e tests
  console.log('Setting up e2e tests...');
});

afterAll(async () => {
  // Cleanup after all e2e tests
  console.log('Cleaning up e2e tests...');
});


