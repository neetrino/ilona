/**
 * Deploy migrations: if the payment unique-index migration previously failed
 * (e.g. due to duplicates), mark it rolled back so it can be re-applied, then deploy.
 * Safe to run on every deploy (resolve no-ops if migration is not in failed state).
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const prismaDir = path.join(__dirname, '..');
const repoRoot = path.join(prismaDir, '../..');
const migrationName = '20260226100000_add_payment_student_month_unique';

// Load .env.local from repo root so DATABASE_URL and DIRECT_URL are set
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

function run(cmd, ignoreError = false) {
  try {
    execSync(cmd, { cwd: prismaDir, stdio: 'inherit', shell: true });
  } catch (e) {
    if (!ignoreError) throw e;
  }
}

run(`npx prisma migrate resolve --rolled-back "${migrationName}"`, true);
run('npx prisma migrate deploy');
