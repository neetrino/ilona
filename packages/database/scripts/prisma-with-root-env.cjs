/**
 * Run `npx prisma …` from the database package with env loaded from repo root
 * (`.env.local`, then `.env`), matching migrate-deploy-with-resolve.js.
 * If DIRECT_URL is missing but DATABASE_URL is set, sets DIRECT_URL = DATABASE_URL
 * so Prisma CLI works with local Postgres (no pooler).
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const prismaDir = path.join(__dirname, '..');
const repoRoot = path.join(prismaDir, '..', '..');

function loadRootEnv() {
  for (const name of ['.env.local', '.env']) {
    const envPath = path.join(repoRoot, name);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    });
  }
  if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
}

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
