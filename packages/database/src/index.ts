import { PrismaClient } from './generated/client';
import { config as loadEnv } from 'dotenv';

// Minimal Node env type so build works when devDependencies (e.g. @types/node) are not installed (e.g. Render NODE_ENV=production)
declare const process: { env: Record<string, string | undefined> };

// Load .env.local / .env when DATABASE_URL is not set (e.g. local dev or scripts). Production (Render) sets env vars, so this is a no-op.
if (typeof process !== 'undefined' && !process.env.DATABASE_URL) {
  loadEnv(); // .env from cwd
  loadEnv({ path: '.env.local' });
  loadEnv({ path: '../../.env.local' }); // repo root when cwd is packages/database
}

// PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export from package-owned generated client (single source of truth for schema types)
export * from './generated/client';

// Export prisma client as default
export default prisma;

