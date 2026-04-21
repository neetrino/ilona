/**
 * One-shot: create the missing `teacher_centers` table on production.
 * The historic `add_teacher_centers` migration is recorded as applied but the
 * DDL never landed. Reuses the SQL splitter from the reconcile script.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { PrismaClient } from '../src/generated/client';

const possibleEnvPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(__dirname, '../../../.env.local'),
];
for (const p of possibleEnvPaths) {
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}

const SQL_FILE = resolve(__dirname, 'fix-teacher-centers.sql');
const prisma = new PrismaClient();

function splitSqlStatements(sql: string): string[] {
  const stripped = sql
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');

  const statements: string[] = [];
  let buffer = '';
  let inDollar = false;
  let i = 0;
  while (i < stripped.length) {
    const ch = stripped[i];
    if (!inDollar && ch === '$' && stripped[i + 1] === '$') {
      inDollar = true;
      buffer += '$$';
      i += 2;
      continue;
    }
    if (inDollar && ch === '$' && stripped[i + 1] === '$') {
      inDollar = false;
      buffer += '$$';
      i += 2;
      continue;
    }
    if (!inDollar && ch === ';') {
      const trimmed = buffer.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      buffer = '';
      i += 1;
      continue;
    }
    buffer += ch;
    i += 1;
  }
  const tail = buffer.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

async function run(): Promise<void> {
  const sql = readFileSync(SQL_FILE, 'utf8');
  const statements = splitSqlStatements(sql);
  console.log(`Applying ${statements.length} statements...`);
  for (let i = 0; i < statements.length; i += 1) {
    try {
      await prisma.$executeRawUnsafe(statements[i]);
    } catch (err) {
      console.error(`Statement ${i + 1} failed:\n${statements[i]}\n`);
      throw err;
    }
  }
  const count = await prisma.teacherCenter.count();
  console.log(`✔ teacher_centers exists. Row count: ${count}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
