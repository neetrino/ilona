/**
 * Deploy migrations: if the payment unique-index migration previously failed
 * (e.g. due to duplicates), mark it rolled back so it can be re-applied, then deploy.
 * Safe to run on every deploy (resolve no-ops if migration is not in failed state).
 */
const { execSync } = require('child_process');
const path = require('path');

const prismaDir = path.join(__dirname, '..');
const migrationName = '20260226100000_add_payment_student_month_unique';

function run(cmd, ignoreError = false) {
  try {
    execSync(cmd, { cwd: prismaDir, stdio: 'inherit', shell: true });
  } catch (e) {
    if (!ignoreError) throw e;
  }
}

run(`npx prisma migrate resolve --rolled-back "${migrationName}"`, true);
run('npx prisma migrate deploy');
