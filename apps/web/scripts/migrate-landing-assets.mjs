import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public/landing');

/** Fresh Figma MCP asset URLs mapped to stable public filenames. */
const ASSETS = {
  'hero-person.webp': 'https://www.figma.com/api/mcp/asset/9e7aa559-1120-4d32-95d2-3e9475eb2bef',
  'hero-uk-badge.webp': 'https://www.figma.com/api/mcp/asset/37d1fc91-bc7a-4480-9c9b-238333db2403',
  'hero-us-badge.webp': 'https://www.figma.com/api/mcp/asset/2de46464-5eca-49c1-962e-69dea85f53eb',
  'about-big-ben.webp': 'https://www.figma.com/api/mcp/asset/dc799d9a-d071-4449-b037-75b2491b104f',
  'about-flag.webp': 'https://www.figma.com/api/mcp/asset/526b31a1-a45c-4bed-93c8-57ab0ea72ec4',
  'about-success-icon.webp': 'https://www.figma.com/api/mcp/asset/296ec7e9-df1b-4597-8a80-ce1c126500af',
  'about-branches-icon.webp': 'https://www.figma.com/api/mcp/asset/7ee1d39d-49aa-4524-8907-3b6314b2ce56',
  'why-methods.webp': 'https://www.figma.com/api/mcp/asset/1a993714-13cc-4bd6-bc29-43278b44f709',
  'why-results.webp': 'https://www.figma.com/api/mcp/asset/9e5b2528-871d-4cb3-8975-f8d4cf70dc80',
  'why-teachers.webp': 'https://www.figma.com/api/mcp/asset/ddfe8d6e-32ae-4e02-9d5c-d59d0ecb72c2',
  'why-schedule.webp': 'https://www.figma.com/api/mcp/asset/013d9744-54c8-4d02-9a6e-8e20540ff66f',
  'student-success.webp': 'https://www.figma.com/api/mcp/asset/8514097d-d12a-442c-952a-c0703233dcb6',
  'register-submit-icon.webp': 'https://www.figma.com/api/mcp/asset/dfe82a1b-95d5-4d20-9a2a-f7c49cd021bb',
  'branch-map-icon.webp': 'https://www.figma.com/api/mcp/asset/b6909872-f516-4967-a1d8-9052dd13bf46',
  'branch-nav-arrow.webp': 'https://www.figma.com/api/mcp/asset/860d5675-0fcf-4b1d-a331-552aaabe8f70',
  'follow-instagram.webp': 'https://www.figma.com/api/mcp/asset/da70aaeb-8dbc-433e-bda9-b57c4465c5bd',
  'follow-facebook.webp': 'https://www.figma.com/api/mcp/asset/5c256447-7729-4740-82b3-865ab0afc2f8',
  'follow-telegram.webp': 'https://www.figma.com/api/mcp/asset/5b0b264c-6b9b-4ea4-9b25-fb4c248879d7',
  'get-touch-phone.webp': 'https://www.figma.com/api/mcp/asset/da7b06fb-1857-447b-94d2-6eb0df1ecc5b',
  'get-touch-email.webp': 'https://www.figma.com/api/mcp/asset/deb09042-45f3-4e73-b800-1db33b049df9',
  'team-check-icon.webp': 'https://www.figma.com/api/mcp/asset/926c170d-8f8f-486d-9254-24b74efdd71d',
  'team-send-cv-icon.webp': 'https://www.figma.com/api/mcp/asset/8df795a5-bc49-4562-9fa0-e5aa3bcef1bd',
  'news-image-1.webp': 'https://www.figma.com/api/mcp/asset/451d8b08-fbad-4d96-9fc0-f3493826436e',
  'news-image-1-overlay.webp': 'https://www.figma.com/api/mcp/asset/b1a77618-8759-4a6c-bd78-4a1a1455a450',
  'news-image-2.webp': 'https://www.figma.com/api/mcp/asset/6eb7e8b2-28bd-4f25-93c5-77498d41551e',
  'news-image-2-overlay.webp': 'https://www.figma.com/api/mcp/asset/699268ab-3bef-4b21-9373-d04376c36f0d',
  'news-image-3.webp': 'https://www.figma.com/api/mcp/asset/10e2fef4-23b7-4807-8672-5a8ae0d24932',
  'news-image-3-overlay.webp': 'https://www.figma.com/api/mcp/asset/6b706c77-3f86-45a5-910a-0f36cbe85e70',
  'news-arrow-icon.webp': 'https://www.figma.com/api/mcp/asset/006475e6-24dc-45dc-90f6-603215baf73c',
  'faq-dropdown-icon.webp': 'https://www.figma.com/api/mcp/asset/3c1d588d-967a-4534-9a25-61485ed58bf7',
  'footer-logo.webp': 'https://www.figma.com/api/mcp/asset/96fda612-5733-4b98-8551-85bcd70e131e',
  'footer-social-instagram.webp': 'https://www.figma.com/api/mcp/asset/7612a6ab-53af-45af-aa74-75bc54462020',
  'footer-social-facebook.webp': 'https://www.figma.com/api/mcp/asset/3cd67af9-a866-44c6-9dab-40b0c347e3f1',
  'footer-social-telegram.webp': 'https://www.figma.com/api/mcp/asset/ee88c749-2a0c-4c13-b6a2-11cbc5f10f6f',
  'footer-social-whatsapp.webp': 'https://www.figma.com/api/mcp/asset/5ba5e6e1-8e8b-4ed4-845a-cf62c086a89b',
  'footer-social-viber.webp': 'https://www.figma.com/api/mcp/asset/903e3148-3ac9-4971-8a06-5e9f2899b337',
  'footer-flag-usa.webp': 'https://www.figma.com/api/mcp/asset/294d7320-c439-42ad-965c-adad033d8cf2',
  'footer-flag-uk.webp': 'https://www.figma.com/api/mcp/asset/e1526c61-b876-409b-85cd-1f651433accd',
};

async function downloadAndConvert(filename, url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${filename}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const outputPath = path.join(publicDir, filename);

  if (filename.endsWith('.webp')) {
    await sharp(buffer).webp({ quality: 85 }).toFile(outputPath);
    return;
  }

  await fs.writeFile(outputPath, buffer);
}

await fs.mkdir(publicDir, { recursive: true });

for (const [filename, url] of Object.entries(ASSETS)) {
  process.stdout.write(`Downloading ${filename}... `);
  await downloadAndConvert(filename, url);
  process.stdout.write('done\n');
}

console.log(`Saved ${Object.keys(ASSETS).length} assets to ${publicDir}`);
