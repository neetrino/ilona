/**
 * Copy generated Prisma client from src/generated to dist/generated
 * so that runtime require('./generated/client') resolves when main is dist/index.js.
 */
const path = require('path');
const fs = require('fs');

const prismaDir = path.join(__dirname, '..');
const srcGen = path.join(prismaDir, 'src', 'generated');
const distGen = path.join(prismaDir, 'dist', 'generated');

if (!fs.existsSync(srcGen)) {
  console.warn('packages/database: src/generated not found (run prisma generate first)');
  process.exit(0);
}

fs.mkdirSync(path.join(prismaDir, 'dist'), { recursive: true });

try {
  if (fs.existsSync(distGen)) {
    fs.rmSync(distGen, { recursive: true, force: true });
  }
  fs.cpSync(srcGen, distGen, { recursive: true });
  console.log('packages/database: copied src/generated -> dist/generated');
} catch (err) {
  if (err.code === 'EPERM' || err.code === 'EPIPE' || err.code === 'EBUSY') {
    console.error('packages/database: copy failed (files may be in use). Stop "pnpm run dev" and run build again.');
  }
  throw err;
}
