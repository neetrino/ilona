/**
 * One-time / repeat download of home page Figma MCP assets to public/images/home.
 * Run from apps/web: node ./scripts/download-home-figma-assets.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'images', 'home');

const ASSETS = [
  [
    'https://www.figma.com/api/mcp/asset/b2373a10-b74b-48ae-b6b4-8bdacb496d31',
    'hero-illustration.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/9f274fec-14f3-4da5-a44f-99d8cb777888',
    'hero-cta-circle.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/967cbd9f-161f-49fd-bfab-4d16ecf06da7',
    'hero-cta-cap.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/794ac4ea-68b9-4f54-a197-b6f62f01fc00',
    'bento-chart.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/fb8a7771-66cc-4eed-a5dd-49f872da6fab',
    'learn-bg.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/f2405563-2b76-4d34-9ef1-a3b71f4cfa66',
    'learn-illustration.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/6a8f7297-84d6-405b-a2b5-339f0fca2d28',
    'branch-pin-1.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/19330c31-dbe6-4191-936b-9cb476b0932e',
    'branch-pin-2.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/4794a176-b0d1-4827-9435-19cda0b80d2a',
    'branch-pin-3.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/5fae788e-347b-4a50-9523-e399df6962d6',
    'branch-pin-4.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/458543d8-dd52-4df5-8f21-e2c4ec68ee0f',
    'cta-portrait.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/63333e2b-5255-42a3-8aee-86d930f6da31',
    'feat-student.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/9dc28bfd-8e6b-4f88-a893-dd58b320b7f9',
    'feat-teacher.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/aa4a9edb-feda-4f2b-a65d-a5962c848390',
    'feat-attendance.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/3ff2aea2-4bc3-4b69-9344-4a042cc99e8f',
    'feat-finance.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/a76d689c-9ca7-4c79-b958-c237cf0b1e6b',
    'feat-analytics.png',
  ],
  [
    'https://www.figma.com/api/mcp/asset/e3ffe85e-4957-4918-87f0-3e2748f21ffd',
    'feat-chat.png',
  ],
];

async function main() {
  mkdirSync(outDir, { recursive: true });
  let failed = 0;
  for (const [url, name] of ASSETS) {
    const dest = join(outDir, name);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'image/*' },
        redirect: 'follow',
      });
      if (!res.ok) {
        console.error(`FAIL ${name}: ${res.status} ${res.statusText}`);
        failed += 1;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 20) {
        console.error(`FAIL ${name}: empty or tiny body (${buf.length} bytes)`);
        failed += 1;
        continue;
      }
      writeFileSync(dest, buf);
      const ct = res.headers.get('content-type') || '';
      console.log(`ok ${name} (${buf.length} b, ${ct})`);
    } catch (e) {
      console.error(`FAIL ${name}:`, e?.message || e);
      failed += 1;
    }
  }
  if (failed > 0) {
    process.exitCode = 1;
  }
  console.log(failed === 0 ? 'All downloads done.' : `Done with ${failed} error(s).`);
}

main();
