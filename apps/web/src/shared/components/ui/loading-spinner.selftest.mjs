/**
 * Smoke checks for global LoadingSpinner wiring.
 * Run: node apps/web/src/shared/components/ui/loading-spinner.selftest.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../..');
const spinnerFile = path.join(here, 'loading-spinner.tsx');
const indexFile = path.join(here, 'index.ts');

assert.equal(fs.existsSync(spinnerFile), true, 'loading-spinner.tsx missing');
const spinnerSrc = fs.readFileSync(spinnerFile, 'utf8');
assert.match(spinnerSrc, /export function LoadingSpinner/);
assert.match(spinnerSrc, /export function PageLoading/);
assert.match(spinnerSrc, /#1010a3/);
assert.equal(spinnerSrc.includes("from '@/shared/components/ui/loading-spinner'"), false);

const indexSrc = fs.readFileSync(indexFile, 'utf8');
assert.match(indexSrc, /loading-spinner/);

const usages = execSync('rg -l "<LoadingSpinner" apps/web/src -g "*.tsx"', {
  encoding: 'utf8',
  cwd: repoRoot,
})
  .split(/\r?\n/)
  .filter(Boolean);

let missingImport = 0;
for (const rel of usages) {
  if (rel.includes('loading-spinner.tsx')) continue;
  const abs = path.resolve(repoRoot, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const hasImport =
    src.includes("ui/loading-spinner'") ||
    src.includes('ui/loading-spinner"') ||
    /import\s*\{[^}]*LoadingSpinner/.test(src);
  if (!hasImport) {
    missingImport += 1;
    console.error('missing import:', rel);
  }
}
assert.equal(missingImport, 0, `${missingImport} files use LoadingSpinner without import`);

let legacy = '';
try {
  legacy = execSync(
    'rg -n "h-12 w-12 animate-spin rounded-full border-2 border-\\[#f1f1f2\\]" apps/web/src/app -g "*.tsx"',
    { encoding: 'utf8', cwd: repoRoot },
  ).trim();
} catch {
  legacy = '';
}
assert.equal(legacy, '', `legacy layout spinners remain:\n${legacy}`);

console.log(`ok: LoadingSpinner exported; ${usages.length} usages checked; layout shells updated`);
