import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory() && !['node_modules', '.next'].includes(f)) walk(p, files);
    else if (/\.(tsx|jsx)$/.test(f)) files.push(p);
  }
  return files;
}

const UI_PATTERNS = [
  { name: 'jsx-text', re: />\s*([A-Z][a-zA-Z][a-zA-Z\s,'\-()\/\.&]{2,55})\s*</g },
  { name: 'placeholder', re: /placeholder=["']([A-Za-z][^"']{3,60})["']/g },
  { name: 'aria-label', re: /aria-label=["']([A-Za-z][^"']{3,50})["']/g },
  { name: 'title-attr', re: /\btitle=["']([A-Za-z][^"']{3,50})["']/g },
  { name: 'label-text', re: /<label[^>]*>\s*([A-Z][^<{\n]{2,40})\s*<\/label>/g },
];

const SKIP_TEXT = new Set([
  'Promise', 'SVG', 'Image', 'Link', 'Button', 'div', 'span', 'path',
  'EN', 'CRM', 'AMD', 'SUB', 'API', 'URL', 'ID', 'OK',
]);

function isLikelyHardcoded(text) {
  const t = text.trim();
  if (t.length < 3 || /^\{/.test(t) || /^[A-Z0-9_]+$/.test(t)) return false;
  if (SKIP_TEXT.has(t)) return false;
  if (/^(className|http|https|#|px-|flex|grid|md:|lg:|sm:)/.test(t)) return false;
  if (/^[A-Z][a-z]+$/.test(t) && t.length < 5) return false; // single short words
  return /^[A-Z]/.test(t) && /[a-z]/.test(t);
}

const files = walk('src');
const byFile = {};
let total = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const usesT = content.includes('useTranslations') || content.includes('getTranslations');
  const rel = file.replace(/\\/g, '/');
  const hits = [];

  for (const line of content.split('\n')) {
    if (line.includes('useTranslations') || line.match(/\bt\s*\(/)) continue;
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

    for (const { re } of UI_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const text = m[1].trim();
        if (isLikelyHardcoded(text)) {
          hits.push(text);
        }
      }
    }
  }

  if (hits.length) {
    byFile[rel] = { count: hits.length, usesT, samples: [...new Set(hits)].slice(0, 8) };
    total += hits.length;
  }
}

const sorted = Object.entries(byFile).sort((a, b) => b[1].count - a[1].count);
const withoutT = sorted.filter(([, v]) => !v.usesT);
const withT = sorted.filter(([, v]) => v.usesT);

console.log('=== i18n audit ===');
console.log('Files with likely hardcoded UI:', sorted.length);
console.log('Total hit count:', total);
console.log('Without useTranslations:', withoutT.length);
console.log('With useTranslations but still hardcoded:', withT.length);
console.log('\n--- Top 35 files ---');
sorted.slice(0, 35).forEach(([f, v]) => {
  console.log(`${v.count}\t${v.usesT ? 'T+' : 'T-'}\t${f}`);
  v.samples.forEach((s) => console.log(`    - ${s}`));
});
