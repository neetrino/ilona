/**
 * Ensures groups.secondTeacherId + responsibleTeacherId exist (idempotent).
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const prismaDir = path.join(__dirname, '..');
const repoRoot = path.join(prismaDir, '../..');

for (const name of ['.env', '.env.local']) {
  const envPath = path.join(repoRoot, name);
  if (!fs.existsSync(envPath)) continue;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (name === '.env.local') {
        process.env[key] = value;
      } else if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  });
}

if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const sqlPath = path.join(__dirname, 'reconcile-group-two-teachers.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

execSync('npx prisma db execute --schema prisma/schema.prisma --stdin', {
  cwd: prismaDir,
  input: sql,
  stdio: ['pipe', 'inherit', 'inherit'],
  env: process.env,
});

console.log('reconcile-group-two-teachers: OK');
