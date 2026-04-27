import { readdirSync, readFileSync, renameSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '..', 'public', 'images', 'home');

function detectExt(buf) {
  if (buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  const head = buf.toString('utf8', 0, Math.min(200, buf.length)).trim();
  if (head.startsWith('<svg') || head.startsWith('<?xml') || head.includes('<svg')) {
    return 'svg';
  }
  return null;
}

for (const f of readdirSync(dir)) {
  const ext = extname(f);
  if (ext === '') continue;
  const p = join(dir, f);
  const buf = readFileSync(p);
  const d = detectExt(buf);
  if (!d) {
    console.warn('Unknown format:', f);
    continue;
  }
  const newName = `${basename(f, ext)}.${d}`;
  if (newName === f) continue;
  const np = join(dir, newName);
  if (p !== np) {
    renameSync(p, np);
    console.log(`${f} -> ${newName}`);
  }
}
