import en from '../languages/en.json' with { type: 'json' };
import hy from '../languages/hy.json' with { type: 'json' };

function flatten(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) keys.push(...flatten(v, path));
    else keys.push(path);
  }
  return keys;
}

function getVal(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

const enKeys = new Set(flatten(en));
const hyKeys = new Set(flatten(hy));

const onlyEn = [...enKeys].filter((k) => !hyKeys.has(k)).sort();
const onlyHy = [...hyKeys].filter((k) => !enKeys.has(k)).sort();
const emptyEn = [...enKeys].filter((k) => !getVal(en, k) || String(getVal(en, k)).trim() === '');
const emptyHy = [...hyKeys].filter((k) => !getVal(hy, k) || String(getVal(hy, k)).trim() === '');

console.log('EN keys:', enKeys.size);
console.log('HY keys:', hyKeys.size);
console.log('Only in EN:', onlyEn.length);
console.log('Only in HY:', onlyHy.length);
console.log('Empty EN:', emptyEn.length);
console.log('Empty HY:', emptyHy.length);
if (onlyEn.length) {
  console.log('\n=== ONLY IN EN ===');
  onlyEn.forEach((k) => console.log(k));
}
if (onlyHy.length) {
  console.log('\n=== ONLY IN HY ===');
  onlyHy.forEach((k) => console.log(k));
}
if (emptyEn.length) {
  console.log('\n=== EMPTY EN ===');
  emptyEn.forEach((k) => console.log(k));
}
if (emptyHy.length) {
  console.log('\n=== EMPTY HY ===');
  emptyHy.forEach((k) => console.log(k));
}
