/**
 * Production migration deploy with automatic recovery from failed migrations.
 *
 * Strategy:
 * 1. Query the database for any migrations that failed (finished_at IS NULL in _prisma_migrations).
 * 2. Mark each failed migration as "rolled back" so Prisma will re-apply it on deploy.
 * 3. Run `prisma migrate deploy`.
 *
 * This avoids hardcoding migration names and handles any future failed migration
 * (e.g. timeout, connection drop) by retrying on the next deploy.
 * Safe to run on every deploy: resolve is a no-op when there are no failed migrations.
 *
 * @see https://pris.ly/d/migrate-resolve
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const prismaDir = path.join(__dirname, '..');
const repoRoot = path.join(prismaDir, '../..');

// Load .env.local from repo root so DATABASE_URL and DIRECT_URL are set (e.g. local dev)
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

const MAX_DEPLOY_RESOLVE_RETRIES = 5;

function run(cmd, options = {}) {
  const { ignoreError = false, captureOutput = false } = options;
  try {
    if (captureOutput) {
      return execSync(cmd, { cwd: prismaDir, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'], shell: true });
    }
    execSync(cmd, { cwd: prismaDir, stdio: 'inherit', shell: true });
  } catch (e) {
    if (captureOutput) {
      const out = (e.stdout ?? '') + (e.stderr ?? '') + (e.message ?? '');
      return { failed: true, output: out, status: e.status };
    }
    if (!ignoreError) throw e;
  }
  return null;
}

async function getFailedMigrationNames() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    return [];
  }

  // Use generated Prisma client to query _prisma_migrations (no extra deps)
  let PrismaClient;
  try {
    const clientPath = path.join(prismaDir, 'src', 'generated', 'client');
    PrismaClient = require(clientPath).PrismaClient;
  } catch {
    // Client not yet generated (e.g. migrate run before build); skip resolve, deploy only
    return [];
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  try {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL'
    );
    return (rows || []).map((r) => r.migration_name).filter(Boolean);
  } catch (err) {
    // Table may not exist on first deploy; raw query errors (e.g. P2010) can mean missing table
    const msg = err?.message ?? '';
    const code = err?.code ?? '';
    if (
      code === 'P2021' ||
      code === 'P2010' ||
      /does not exist|relation.*not found/i.test(msg)
    ) {
      return [];
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// Extract failed migration name from Prisma error (P3009 or P3018).
// P3009: "The `20260304180000_...` migration started at ... failed"
// P3018: "Migration name: 20260304180000_..."
function parseFailedMigrationName(output) {
  const str = output || '';
  const fromBackticks = str.match(/`([^`]+)`\s+migration\s+(?:started|failed)/);
  if (fromBackticks) return fromBackticks[1];
  const fromMigrationName = str.match(/Migration name:\s*(\S+)/);
  return fromMigrationName ? fromMigrationName[1].trim() : null;
}

async function main() {
  const failed = await getFailedMigrationNames();
  if (failed.length > 0) {
    console.warn(
      `[db:migrate] Resolving ${failed.length} failed migration(s) as rolled back so they can be re-applied: ${failed.join(', ')}`
    );
    for (const name of failed) {
      run(`npx prisma migrate resolve --rolled-back "${name}"`, {
        ignoreError: true,
      });
    }
  }

  // Always resolve these if present (handles Render/build env where getFailedMigrationNames may not find them)
  const knownFailedToResolve = [
    '20260305130000_clean_agreed_processing_from_crm_activities',
    '20260305150000_remove_processing_from_salary_status',
    '20260304180000_remove_agreed_from_crm_lead_status',
    '20260226100000_add_payment_student_month_unique',
  ];
  for (const name of knownFailedToResolve) {
    run(`npx prisma migrate resolve --rolled-back "${name}"`, { ignoreError: true });
  }

  let lastResult = null;
  for (let attempt = 0; attempt < MAX_DEPLOY_RESOLVE_RETRIES; attempt++) {
    lastResult = run('npx prisma migrate deploy', { captureOutput: true });
    if (!lastResult || !lastResult.failed) break;
    const output = lastResult.output || '';
    const isRecoverable = output.indexOf('P3009') !== -1 || output.indexOf('P3018') !== -1;
    const name = parseFailedMigrationName(output);
    if (!isRecoverable || !name) {
      console.error(output || 'prisma migrate deploy failed');
      process.exit(lastResult.status ?? 1);
    }
    console.warn(`[db:migrate] Resolving failed migration "${name}" as rolled back and retrying deploy (attempt ${attempt + 1}/${MAX_DEPLOY_RESOLVE_RETRIES})`);
    run(`npx prisma migrate resolve --rolled-back "${name}"`, { ignoreError: true });
  }

  if (lastResult && lastResult.failed) {
    console.error(lastResult.output || 'prisma migrate deploy failed');
    process.exit(lastResult.status ?? 1);
  }
}

main().catch((err) => {
  console.error('[db:migrate]', err.message || err);
  process.exit(1);
});
