import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserStatus } from '@ilona/database';

@Injectable()
export class StudentQueryService {
  private readonly logger = new Logger(StudentQueryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAssignedToTeacher(teacherId: string, params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    groupId?: string;
  }) {
    const { skip = 0, take = 50, search, status, groupId } = params || {};

    const skipValue = Number(skip) || 0;
    const takeValue = Number(take) || 50;
    const searchTerm = search?.trim();

    const where: Prisma.StudentWhereInput = {};
    const userWhere: Prisma.UserWhereInput = {};
    userWhere.status = status || 'ACTIVE';

    if (groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        select: { teacherId: true },
      });
      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }
      if (group.teacherId !== teacherId) {
        throw new NotFoundException('Group is not assigned to this teacher');
      }
      where.groupId = groupId;
    } else {
      where.teacherId = teacherId;
    }

    if (searchTerm) {
      userWhere.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere;
    }

    const studentInclude = {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          level: true,
          center: { select: { id: true, name: true } },
        },
      },
      teacher: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    };

    // 1) Fetch students (no pagination yet; we merge with leads first)
    const students = await this.prisma.student.findMany({
      where,
      orderBy: { user: { firstName: 'asc' } },
      include: studentInclude,
    });

    // 2) Fetch assigned onboarding leads (NEW or FIRST_LESSON with teacherId + groupId).
    // Exclude transfer-requested leads so they disappear from teacher's list after Transfer.
    const leadWhere: Prisma.CrmLeadWhereInput = {
      teacherId,
      status: { in: ['NEW', 'FIRST_LESSON'] },
      transferFlag: false,
    };
    if (groupId) {
      leadWhere.groupId = groupId;
    }
    const leads = await this.prisma.crmLead.findMany({
      where: leadWhere,
      orderBy: { updatedAt: 'desc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            center: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 3) Apply search to leads (students already filtered by where)
    const filteredLeads = searchTerm
      ? (() => {
          const searchLower = searchTerm.trim().toLowerCase();
          return leads.filter((l) => {
            const first = (l.firstName ?? '').toLowerCase();
            const last = (l.lastName ?? '').toLowerCase();
            const phone = (l.phone ?? '').toLowerCase();
            return (
              first.includes(searchLower) ||
              last.includes(searchLower) ||
              phone.includes(searchLower)
            );
          });
        })()
      : leads;

    // 4) Build combined list: pending onboarding first, then approved onboarding, then students
    type OnboardingItem = {
      type: 'onboarding';
      leadId: string;
      status: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      teacherApprovedAt: Date | null;
      transferFlag: boolean;
      transferComment: string | null;
      groupId: string | null;
      group: { id: string; name: string; level: string | null; center: { id: string; name: string } | null } | null;
      _sortKey: number;
    };
    const pendingLeads = filteredLeads
      .filter((l) => !l.teacherApprovedAt && !l.transferFlag)
      .map((l, i) => ({
        type: 'onboarding' as const,
        leadId: l.id,
        status: l.status,
        firstName: l.firstName,
        lastName: l.lastName,
        phone: l.phone,
        teacherApprovedAt: l.teacherApprovedAt,
        transferFlag: l.transferFlag,
        transferComment: l.transferComment,
        groupId: l.groupId,
        group: l.group,
        _sortKey: i,
      }));
    const approvedLeads = filteredLeads
      .filter((l) => l.teacherApprovedAt)
      .map((l, i) => ({
        type: 'onboarding' as const,
        leadId: l.id,
        status: l.status,
        firstName: l.firstName,
        lastName: l.lastName,
        phone: l.phone,
        teacherApprovedAt: l.teacherApprovedAt,
        transferFlag: l.transferFlag,
        transferComment: l.transferComment,
        groupId: l.groupId,
        group: l.group,
        _sortKey: 1000 + i,
      }));

    const onboardingItems: OnboardingItem[] = [
      ...pendingLeads,
      ...approvedLeads,
    ];

    type StudentItem = (typeof students)[number] & { type: 'student'; _sortKey: number };
    const studentItems: StudentItem[] = students.map((s, i) => ({
      ...s,
      type: 'student' as const,
      _sortKey: 10000 + i,
    })) as StudentItem[];

    const combined = [...onboardingItems, ...studentItems].sort(
      (a, b) => a._sortKey - b._sortKey,
    );

    const total = combined.length;
    const paginated = combined.slice(skipValue, skipValue + takeValue);

    // Remove _sortKey from response
    const items = paginated.map((item) => {
      if (item.type === 'onboarding') {
        const { _sortKey: _, ...rest } = item;
        return rest;
      }
      const { _sortKey: __, ...rest } = item;
      return rest;
    });

    const totalMonthlyFees = students.reduce(
      (sum, s) => sum + Number(s.monthlyFee ?? 0),
      0,
    );

    return {
      items,
      total,
      page: takeValue > 0 ? Math.floor(skipValue / takeValue) + 1 : 1,
      pageSize: takeValue,
      totalPages: takeValue > 0 ? Math.ceil(total / takeValue) : 0,
      totalMonthlyFees,
    };
  }

  async findAssignedToTeacherByUserId(userId: string, params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    groupId?: string;
  }) {
    try {
      // Get teacher by userId
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher profile not found');
      }

      return this.findAssignedToTeacher(teacher.id, params);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `findAssignedToTeacherByUserId failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Get teachers assigned to a student
   * Returns teachers from:
   * 1. Direct teacherId assignment
   * 2. Group's teacher (if student is in a group)
   */
  async getMyTeachers(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        group: {
          select: { teacherId: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const teacherIds = new Set<string>();

    // Add direct teacher assignment
    if (student.teacherId) {
      teacherIds.add(student.teacherId);
    }

    // Add group's teacher if student is in a group
    if (student.group?.teacherId) {
      teacherIds.add(student.group.teacherId);
    }

    if (teacherIds.size === 0) {
      return [];
    }

    // Fetch all assigned teachers
    const teachers = await this.prisma.teacher.findMany({
      where: {
        id: { in: Array.from(teacherIds) },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return teachers.map((teacher) => ({
      id: teacher.id,
      userId: teacher.userId,
      name: [teacher.user.firstName, teacher.user.lastName].filter(Boolean).join(' ').trim() || undefined,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      phone: teacher.user.phone,
      avatarUrl: teacher.user.avatarUrl,
    }));
  }
}





