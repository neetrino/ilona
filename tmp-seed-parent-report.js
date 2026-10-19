const fs = require('fs');
const { PrismaClient } = require('./packages/database/src/generated/client');

const env = fs.readFileSync('.env', 'utf8');
for (const line of env.split(/\n/)) {
  const i = line.indexOf('=');
  if (i < 1 || line.startsWith('#')) continue;
  if (line.slice(0, i).trim() === 'DATABASE_URL') {
    process.env.DATABASE_URL = line.slice(i + 1).trim().replace(/^"|"$/g, '');
  }
}

const prisma = new PrismaClient();
const marker = JSON.parse(fs.readFileSync('tmp-parent-report-preview.json', 'utf8'));

async function main() {
  await prisma.parentQuarterlyReport.delete({ where: { id: marker.createdReportId } });
  await prisma.student.update({
    where: { id: marker.id },
    data: { parentEmail: marker.previous },
  });
  console.log('restored');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
