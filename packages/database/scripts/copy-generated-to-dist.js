/**
 * Copy generated Prisma client from src/generated to dist/generated
 * so that runtime require('./generated/client') resolves when main is dist/index.js.
 */
const path = require('path');
const fs = require('fs');

const prismaDir = path.join(__dirname, '..');
const srcGen = path.join(prismaDir, 'src', 'generated');
const distGen = path.join(prismaDir, 'dist', 'generated');
const tmpGen = path.join(prismaDir, 'dist', 'generated.__tmp');
const backupGen = path.join(prismaDir, 'dist', 'generated.__bak');

const RETRYABLE_CODES = new Set(['EPERM', 'EBUSY', 'EPIPE']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(opName, fn, retries = 5, baseDelayMs = 150) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return fn();
    } catch (err) {
      lastErr = err;
      if (!err || !RETRYABLE_CODES.has(err.code) || attempt === retries) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`packages/database: ${opName} failed (${err.code}), retrying in ${delay}ms...`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(delay);
    }
  }
  throw lastErr;
}

if (!fs.existsSync(srcGen)) {
  console.warn('packages/database: src/generated not found (run prisma generate first)');
  process.exit(0);
}

fs.mkdirSync(path.join(prismaDir, 'dist'), { recursive: true });

async function main() {
  // Cleanup leftovers from previous interrupted runs.
  if (fs.existsSync(tmpGen)) {
    await withRetry('remove temp generated dir', () => {
      fs.rmSync(tmpGen, { recursive: true, force: true });
    });
  }
  if (fs.existsSync(backupGen)) {
    await withRetry('remove backup generated dir', () => {
      fs.rmSync(backupGen, { recursive: true, force: true });
    });
  }

  // 1) Prepare new generated snapshot in a temporary directory.
  await withRetry('copy src/generated -> temp', () => {
    fs.cpSync(srcGen, tmpGen, { recursive: true });
  });

  // 2) Swap atomically-ish: current -> backup, temp -> current.
  //    If current dir is locked (EPERM/EBUSY), fallback to in-place sync copy.
  let movedCurrentToBackup = false;
  try {
    if (fs.existsSync(distGen)) {
      await withRetry('rename dist/generated -> backup', () => {
        fs.renameSync(distGen, backupGen);
      });
      movedCurrentToBackup = true;
    }

    await withRetry('rename temp -> dist/generated', () => {
      fs.renameSync(tmpGen, distGen);
    });

    // 3) New snapshot is live. Remove backup.
    if (movedCurrentToBackup && fs.existsSync(backupGen)) {
      await withRetry('remove backup generated dir', () => {
        fs.rmSync(backupGen, { recursive: true, force: true });
      });
    }
  } catch (err) {
    if (err && RETRYABLE_CODES.has(err.code)) {
      console.warn('packages/database: swap is locked, falling back to in-place sync copy');
      await withRetry('sync copy src/generated -> dist/generated', () => {
        fs.cpSync(srcGen, distGen, { recursive: true, force: true });
      });
      if (movedCurrentToBackup && fs.existsSync(backupGen)) {
        await withRetry('restore backup generated dir', () => {
          fs.rmSync(backupGen, { recursive: true, force: true });
        });
      }
      console.log('packages/database: copied src/generated -> dist/generated (in-place fallback)');
      return;
    }

    // Rollback best effort: if temp still exists and current is missing, restore backup.
    try {
      if (!fs.existsSync(distGen) && movedCurrentToBackup && fs.existsSync(backupGen)) {
        fs.renameSync(backupGen, distGen);
      }
    } catch (rollbackErr) {
      console.error('packages/database: rollback failed after copy error.');
      console.error(rollbackErr);
    }
    throw err;
  } finally {
    // Final cleanup of temp artifacts.
    if (fs.existsSync(tmpGen)) {
      try {
        fs.rmSync(tmpGen, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors - next run will clean leftovers.
      }
    }
  }

  console.log('packages/database: copied src/generated -> dist/generated safely');
}

main().catch((err) => {
  if (err && RETRYABLE_CODES.has(err.code)) {
    console.error('packages/database: copy failed (files may be in use). Stop "pnpm run dev" and run build again.');
  }
  throw err;
});
