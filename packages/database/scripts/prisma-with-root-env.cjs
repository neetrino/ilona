/**
 * Run `npx prisma …` from the database package with env loaded from repo root `.env`
 * (fallback `.env.local`). If DIRECT_URL is missing but DATABASE_URL is set,
 * sets DIRECT_URL = DATABASE_URL so Prisma CLI works with local Postgres.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const { loadRootEnv } = require('./load-root-env.cjs');

const prismaDir = path.join(__dirname, '..');

loadRootEnv();

const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error('Usage: node scripts/prisma-with-root-env.cjs <prisma-args…>\nExample: node scripts/prisma-with-root-env.cjs db push');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  cwd: prismaDir,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);
