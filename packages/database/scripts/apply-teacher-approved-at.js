/**
 * Apply teacherApprovedAt column to crm_leads (safe to run multiple times).
 * Loads repo-root `.env` for DATABASE_URL / DIRECT_URL.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadRootEnv } = require('./load-root-env.cjs');

const prismaDir = path.join(__dirname, '..');

loadRootEnv();

const sqlFile = path.join(prismaDir, 'prisma', 'migrations', '20260305120000_add_teacher_approved_at_crm_lead', 'migration.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8').trim();
const useIfExists = sqlContent.replace(
  'ADD COLUMN "teacherApprovedAt"',
  'ADD COLUMN IF NOT EXISTS "teacherApprovedAt"'
);
const tmpFile = path.join(prismaDir, 'prisma', '_apply_teacher_approved.sql');
fs.writeFileSync(tmpFile, useIfExists, 'utf8');

try {
  execSync('npx prisma db execute --file prisma/_apply_teacher_approved.sql', {
    cwd: prismaDir,
    stdio: 'inherit',
    shell: true,
  });
  console.log('teacherApprovedAt column applied (or already exists).');
} finally {
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
}
