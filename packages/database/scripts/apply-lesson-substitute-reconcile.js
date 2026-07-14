/**
 * Ensures lessons.substituteTeacherId exists (idempotent).
 * Loads repo-root `.env`.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadRootEnv } = require('./load-root-env.cjs');

const prismaDir = path.join(__dirname, '..');

loadRootEnv();

const sqlPath = path.join(__dirname, 'reconcile-lesson-substitute-teacher.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

execSync('npx prisma db execute --schema prisma/schema.prisma --stdin', {
  cwd: prismaDir,
  input: sql,
  stdio: ['pipe', 'inherit', 'inherit'],
  env: process.env,
});

console.log('reconcile-lesson-substitute: OK');
