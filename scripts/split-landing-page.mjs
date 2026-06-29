import fs from 'fs';
import path from 'path';

const srcPath = 'apps/web/src/app/[locale]/page.tsx';
const content = fs.readFileSync(srcPath, 'utf8');

const sections = [
  ['LandingHeroSection', 'Hero Section', 'About Section'],
  ['LandingAboutSection', 'About Section', 'Why Choose IEC'],
  ['LandingWhyChooseSection', 'Why Choose IEC', 'Student Success — mobile Figma 1:1024'],
  ['LandingStudentSuccessSection', 'Student Success — mobile Figma 1:1024', 'Student Success Programs'],
  ['LandingProgramsSection', 'Student Success Programs', 'Our Branches'],
  ['LandingBranchesSection', 'Our Branches', 'Follow Us'],
  ['LandingFollowUsSection', 'Follow Us', 'Get in Touch'],
  ['LandingGetInTouchSection', 'Get in Touch', 'Join Our Team'],
  ['LandingJoinTeamSection', 'Join Our Team', 'Latest News'],
  ['LandingNewsSection', 'Latest News', 'FAQ'],
  ['LandingFaqSection', 'FAQ', 'Footer'],
];

function extract(startLabel, endLabel) {
  const startNeedle = `{/* ${startLabel}`;
  const endNeedle = endLabel ? `{/* ${endLabel}` : '</CanvasScaler>';
  const start = content.indexOf(startNeedle);
  const end = content.indexOf(endNeedle, start);
  if (start === -1 || end === -1) {
    throw new Error(`Marker not found: ${startLabel} -> ${endLabel}`);
  }
  return content.slice(start, end).trim();
}

const outDir = 'apps/web/src/features/landing/components';
fs.mkdirSync(outDir, { recursive: true });

for (const [name, start, end] of sections) {
  const jsx = extract(start, end);
  fs.writeFileSync(path.join(outDir, `${name}.tsx`), jsx);
}

const footerStart = content.indexOf('{/* Footer');
const footerEnd = content.indexOf('</CanvasScaler>', footerStart);
fs.writeFileSync(
  path.join(outDir, 'LandingFooter.tsx'),
  content.slice(footerStart, footerEnd).trim(),
);

for (const [name] of [...sections, ['LandingFooter']]) {
  const fileName = Array.isArray(name) ? name[0] : name;
  const filePath = path.join(outDir, `${fileName}.tsx`);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
  console.log(`${fileName}: ${lines} lines`);
}
