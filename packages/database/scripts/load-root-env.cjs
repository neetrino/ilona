/**
 * Load repo-root `.env` into process.env (fallback: `.env.local` if `.env` is missing).
 */
const path = require('path');
const fs = require('fs');

const repoRoot = path.join(__dirname, '../../..');

function parseAndApply(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  });
}

function loadRootEnv() {
  const preferred = path.join(repoRoot, '.env');
  const fallback = path.join(repoRoot, '.env.local');
  if (fs.existsSync(preferred)) {
    parseAndApply(preferred);
  } else if (fs.existsSync(fallback)) {
    parseAndApply(fallback);
  }
  if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
  return repoRoot;
}

module.exports = { loadRootEnv, repoRoot };
