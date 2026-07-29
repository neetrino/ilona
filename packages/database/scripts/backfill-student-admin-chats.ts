/**
 * Ensure every ACTIVE student has a DIRECT chat with the canonical ACTIVE admin.
 *
 * Run from repo root:
 *   pnpm --filter @ilona/database exec tsx scripts/backfill-student-admin-chats.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { ChatType, PrismaClient, UserRole, UserStatus } from '../src/generated/client';

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

async function findExistingDirectChat(
  studentUserId: string,
  adminUserId: string,
): Promise<string | null> {
  const userIds = [studentUserId, adminUserId].sort();
  const chats = await prisma.chat.findMany({
    where: {
      type: ChatType.DIRECT,
      participants: {
        some: { userId: studentUserId, leftAt: null },
      },
    },
    include: {
      participants: {
        where: { leftAt: null },
        select: { userId: true },
      },
    },
  });

  const existing = chats.find((chat) => {
    const ids = chat.participants.map((p) => p.userId).sort();
    return ids.length === 2 && ids[0] === userIds[0] && ids[1] === userIds[1];
  });

  return existing?.id ?? null;
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!admin) {
    console.error('No ACTIVE admin user found — nothing to backfill.');
    process.exitCode = 1;
    return;
  }

  console.log(`Using admin: ${admin.firstName} ${admin.lastName} <${admin.email}> (${admin.id})`);

  const students = await prisma.user.findMany({
    where: { role: UserRole.STUDENT, status: UserStatus.ACTIVE },
    select: { id: true, email: true },
  });

  let created = 0;
  let alreadyHad = 0;

  for (const student of students) {
    const existingId = await findExistingDirectChat(student.id, admin.id);
    if (existingId) {
      alreadyHad += 1;
      continue;
    }

    await prisma.chat.create({
      data: {
        type: ChatType.DIRECT,
        participants: {
          create: [
            { userId: student.id, isAdmin: true },
            { userId: admin.id, isAdmin: false },
          ],
        },
      },
    });
    created += 1;
    console.log(`Created admin DM for ${student.email}`);
  }

  console.log(
    `Done. students=${students.length} created=${created} alreadyHad=${alreadyHad}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
