/**
 * Apply teacherApprovedAt column to crm_leads (safe to run multiple times).
 * Loads .env.local from repo root for DATABASE_URL / DIRECT_URL.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const prismaDir = path.join(__dirname, '..');
const repoRoot = path.join(prismaDir, '../..');

const envPath = path.join(repoRoot, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

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
