/**
 * Ensure every active center has a current manager, and create the demo
 * login account manager@ilona.edu / manager123 when a center still needs one.
 *
 * Run from repo root:
 *   pnpm --filter @ilona/database exec tsx scripts/ensure-demo-managers.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/client';

const possibleEnvPaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(__dirname, '../../../.env'),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(__dirname, '../../../.env.local'),
];
for (const p of possibleEnvPaths) {
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}

const prisma = new PrismaClient();

const DEMO_MANAGER_EMAIL = 'manager@ilona.edu';
const DEMO_MANAGER_PASSWORD = 'manager123';

function slugFromCenterName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24);
  return slug || 'branch';
}

async function ensureManagerForCenter(params: {
  centerId: string;
  centerName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<'created' | 'skipped'> {
  const existingEmail = await prisma.user.findUnique({
    where: { email: params.email },
    select: { id: true },
  });
  if (existingEmail) {
    console.log(`⏭  Skip ${params.email} (already exists)`);
    return 'skipped';
  }

  const passwordHash = await bcrypt.hash(params.password, 10);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: params.email,
        passwordHash,
        firstName: params.firstName,
        lastName: params.lastName,
        role: 'MANAGER',
        status: 'ACTIVE',
      },
    });
    await tx.managerProfile.create({
      data: {
        userId: user.id,
        centerId: params.centerId,
        isCurrentAssignment: true,
      },
    });
  });

  console.log(`✅ Created manager ${params.email} → ${params.centerName}`);
  return 'created';
}

async function main() {
  console.log('Ensuring managers for centers without a current assignment…');

  const centers = await prisma.center.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const currentAssignments = await prisma.managerProfile.findMany({
    where: { isCurrentAssignment: true },
    select: { centerId: true },
  });
  const coveredCenterIds = new Set(currentAssignments.map((a) => a.centerId));
  const uncovered = centers.filter((c) => !coveredCenterIds.has(c.id));

  if (uncovered.length === 0) {
    console.log('All active centers already have a manager.');
  }

  let demoExists = Boolean(
    await prisma.user.findUnique({
      where: { email: DEMO_MANAGER_EMAIL },
      select: { id: true },
    }),
  );

  for (const center of uncovered) {
    if (!demoExists) {
      await ensureManagerForCenter({
        centerId: center.id,
        centerName: center.name,
        email: DEMO_MANAGER_EMAIL,
        password: DEMO_MANAGER_PASSWORD,
        firstName: 'Demo',
        lastName: 'Manager',
      });
      demoExists = true;
      continue;
    }

    const slug = slugFromCenterName(center.name);
    await ensureManagerForCenter({
      centerId: center.id,
      centerName: center.name,
      email: `manager.${slug}@ilona.edu`,
      password: DEMO_MANAGER_PASSWORD,
      firstName: 'Manager',
      lastName: center.name.slice(0, 40),
    });
  }

  if (!demoExists) {
    console.log(
      `⚠  ${DEMO_MANAGER_EMAIL} not created: every center already has a manager.`,
    );
  }

  console.log('Done. Demo login: Manager button → Sign In.');
  console.log(`   email: ${DEMO_MANAGER_EMAIL}`);
  console.log(`   password: ${DEMO_MANAGER_PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
