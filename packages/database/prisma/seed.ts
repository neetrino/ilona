import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // SYSTEM SETTINGS
  // ============================================
  console.log('📋 Creating system settings...');
  
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      vocabDeductionPercent: 10,
      feedbackDeductionPercent: 5,
      maxUnjustifiedAbsences: 3,
      paymentDueDays: 5,
      lessonReminderHours: 24,
      absencePercent: 25,
      feedbacksPercent: 25,
      voicePercent: 25,
      textPercent: 25,
    },
  });

  // ============================================
  // ADMIN USER
  // ============================================
  console.log('👤 Creating admin user...');
  
  const adminPassword = await hashPassword('admin123');
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ilona.edu' },
    update: {},
    create: {
      email: 'admin@ilona.edu',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+374 99 123456',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`  ✅ Admin created: ${admin.email}`);

  // ============================================
  // CENTERS
  // ============================================
  console.log('🏢 Creating centers...');

  const centers = await Promise.all([
    prisma.center.upsert({
      where: { id: 'center-1' },
      update: {},
      create: {
        id: 'center-1',
        name: 'Ilona Center - Downtown',
        address: 'Abovyan St. 10, Yerevan',
        phone: '+374 10 123456',
        email: 'downtown@ilona.edu',
      },
    }),
    prisma.center.upsert({
      where: { id: 'center-2' },
      update: {},
      create: {
        id: 'center-2',
        name: 'Ilona Center - Mashtots',
        address: 'Mashtots Ave. 45, Yerevan',
        phone: '+374 10 234567',
        email: 'mashtots@ilona.edu',
      },
    }),
    prisma.center.upsert({
      where: { id: 'center-3' },
      update: {},
      create: {
        id: 'center-3',
        name: 'Ilona Center - Komitas',
        address: 'Komitas Ave. 78, Yerevan',
        phone: '+374 10 345678',
        email: 'komitas@ilona.edu',
      },
    }),
    prisma.center.upsert({
      where: { id: 'center-4' },
      update: {},
      create: {
        id: 'center-4',
        name: 'Ilona Center - Arabkir',
        address: 'Arabkir St. 22, Yerevan',
        phone: '+374 10 456789',
        email: 'arabkir@ilona.edu',
      },
    }),
  ]);

  console.log(`  ✅ Created ${centers.length} centers`);

  // ============================================
  // TEACHER USER
  // ============================================
  console.log('👨‍🏫 Creating demo teacher...');

  const teacherPassword = await hashPassword('teacher123');
  
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@ilona.edu' },
    update: {},
    create: {
      email: 'teacher@ilona.edu',
      passwordHash: teacherPassword,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+374 99 234567',
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      bio: 'Experienced English teacher with 5+ years of teaching.',
      specialization: 'General English, Business English',
      hourlyRate: 5000, // AMD
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      workingHours: { start: '09:00', end: '18:00' },
    },
  });

  console.log(`  ✅ Teacher created: ${teacherUser.email}`);

  // ============================================
  // GROUP
  // ============================================
  console.log('👥 Creating demo group...');

  const group = await prisma.group.upsert({
    where: { id: 'group-1' },
    update: {},
    create: {
      id: 'group-1',
      name: 'Beginners A1 - Morning',
      level: 'Beginner (A1)',
      description: 'English for absolute beginners',
      maxStudents: 12,
      centerId: centers[0].id,
      teacherId: teacher.id,
    },
  });

  console.log(`  ✅ Group created: ${group.name}`);

  // ============================================
  // STUDENT USER
  // ============================================
  console.log('👨‍🎓 Creating demo student...');

  const studentPassword = await hashPassword('student123');
  
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@ilona.edu' },
    update: {},
    create: {
      email: 'student@ilona.edu',
      passwordHash: studentPassword,
      firstName: 'Anna',
      lastName: 'Hovhannisyan',
      phone: '+374 99 345678',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      groupId: group.id,
      parentName: 'Armen Hovhannisyan',
      parentPhone: '+374 99 456789',
      parentEmail: 'parent@email.com',
      monthlyFee: 40000, // AMD
      receiveReports: true,
    },
  });

  console.log(`  ✅ Student created: ${studentUser.email}`);

  // ============================================
  // GROUP CHAT
  // ============================================
  console.log('💬 Creating group chat...');

  const chat = await prisma.chat.upsert({
    where: { groupId: group.id },
    update: {},
    create: {
      type: 'GROUP',
      name: group.name,
      groupId: group.id,
    },
  });

  // Add participants
  await prisma.chatParticipant.upsert({
    where: { chatId_userId: { chatId: chat.id, userId: teacherUser.id } },
    update: {},
    create: {
      chatId: chat.id,
      userId: teacherUser.id,
      isAdmin: true,
    },
  });

  await prisma.chatParticipant.upsert({
    where: { chatId_userId: { chatId: chat.id, userId: studentUser.id } },
    update: {},
    create: {
      chatId: chat.id,
      userId: studentUser.id,
      isAdmin: false,
    },
  });

  // Add admin to chat (so admin can see all chats)
  await prisma.chatParticipant.upsert({
    where: { chatId_userId: { chatId: chat.id, userId: admin.id } },
    update: {},
    create: {
      chatId: chat.id,
      userId: admin.id,
      isAdmin: true,
    },
  });

  // Add a welcome message
  await prisma.message.upsert({
    where: { id: 'welcome-message' },
    update: {},
    create: {
      id: 'welcome-message',
      chatId: chat.id,
      senderId: teacherUser.id,
      type: 'TEXT',
      content: 'Welcome to the Advanced English group chat! Feel free to ask questions and practice your English here.',
    },
  });

  console.log(`  ✅ Group chat created with participants`);

  // ============================================
  // DONE
  // ============================================
  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📋 Demo accounts:');
  console.log('  Admin:   admin@ilona.edu / admin123');
  console.log('  Teacher: teacher@ilona.edu / teacher123');
  console.log('  Student: student@ilona.edu / student123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

