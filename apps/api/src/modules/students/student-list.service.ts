import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole, UserStatus, RiskLabel, StudentStatus } from '@ilona/database';
import { NEW_PAID_STUDENT_LABEL_DAYS } from './student-crud.util';

@Injectable()
export class StudentListService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    groupId?: string;
    groupIds?: string[];
    status?: UserStatus;
    statusIds?: UserStatus[];
    teacherId?: string;
    teacherIds?: string[];
    centerId?: string;
    centerIds?: string[];
    /** Filter by persisted Student.status (lifecycle) values. */
    lifecycleStatuses?: StudentStatus[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    month?: number;
    year?: number;
    currentUserId?: string;
    userRole?: UserRole;
  }) {
    const { skip = 0, take = 50, search, groupId, groupIds, status, statusIds, teacherId, teacherIds, centerId, centerIds, lifecycleStatuses, sortBy, sortOrder = 'asc', currentUserId, userRole } = params || {};

    const where: Prisma.StudentWhereInput = {};
    const userWhere: Prisma.UserWhereInput = {};

    // Teacher scoping: only allow access to students in groups assigned to the teacher
    let teacherGroupIds: string[] | null = null;
    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });
      if (!teacher) {
        return { items: [], total: 0, page: 1, pageSize: take, totalPages: 0, totalMonthlyFees: 0 };
      }
      const groups = await this.prisma.group.findMany({
        where: { teacherId: teacher.id, isActive: true },
        select: { id: true },
      });
      teacherGroupIds = groups.map((g) => g.id);

      const requestedGroupIds = groupIds && groupIds.length > 0 ? groupIds : groupId ? [groupId] : [];
      if (requestedGroupIds.length > 0) {
        const notAllowed = requestedGroupIds.filter((id) => !(teacherGroupIds ?? []).includes(id));
        if (notAllowed.length > 0) {
          throw new ForbiddenException('You do not have access to this group');
        }
      } else {
        // No group filter: restrict to teacher's groups only
        if (teacherGroupIds.length === 0) {
          return { items: [], total: 0, page: 1, pageSize: take, totalPages: 0, totalMonthlyFees: 0 };
        }
        where.groupId = { in: teacherGroupIds };
      }
    }

    if (search) {
      const term = search.trim();
      if (term) {
        userWhere.OR = [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    // Filter by status (single or multiple)
    if (statusIds && statusIds.length > 0) {
      userWhere.status = { in: statusIds };
    } else if (status) {
      userWhere.status = status;
    }

    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere;
    }

    // Support both single groupId (backward compatibility) and groupIds array (only if not already set by teacher scope)
    if (teacherGroupIds === null) {
      if (groupIds && groupIds.length > 0) {
        where.groupId = { in: groupIds };
      } else if (groupId) {
        where.groupId = groupId;
      }
    }

    // Filter by teacherId (single or multiple)
    if (teacherIds && teacherIds.length > 0) {
      where.teacherId = { in: teacherIds };
    } else if (teacherId) {
      where.teacherId = teacherId;
    }

    // Filter by center: group location OR explicit student.centerId
    if (centerIds && centerIds.length > 0) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [{ group: { centerId: { in: centerIds } } }, { centerId: { in: centerIds } }],
        },
      ];
    } else if (centerId) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [{ group: { centerId } }, { centerId }],
        },
      ];
    }

    // Filter by persisted lifecycle status (NEW, UNGROUPED, RISK, HIGH_RISK, etc.).
    if (lifecycleStatuses && lifecycleStatuses.length > 0) {
      where.status = { in: lifecycleStatuses };
    }

    // Build orderBy based on sortBy parameter
    // Only 'absence' requires in-memory sort (depends on computed attendance). 'student' uses DB orderBy.
    let orderBy: Prisma.StudentOrderByWithRelationInput | Prisma.StudentOrderByWithRelationInput[];
    if (sortBy === 'student') {
      orderBy = [
        { user: { firstName: sortOrder } },
        { user: { lastName: sortOrder } },
      ];
    } else if (sortBy === 'monthlyFee') {
      orderBy = { monthlyFee: sortOrder };
    } else if (sortBy === 'register') {
      orderBy = { registerDate: sortOrder };
    } else if (sortBy === 'absence') {
      orderBy = [
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ];
    } else {
      orderBy = [
        { user: { firstName: sortOrder } },
        { user: { lastName: sortOrder } },
      ];
    }

    // Only absence sort requires in-memory sort (computed from attendance). Cap fetch to limit memory.
    const shouldSortInMemory = sortBy === 'absence';
    const ABSENCE_SORT_FETCH_CAP = 1000;
    const fetchSkip = shouldSortInMemory ? 0 : skip;
    const fetchTake = shouldSortInMemory ? ABSENCE_SORT_FETCH_CAP : take;

    const [items, total, totalMonthlyFeesResult] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip: fetchSkip,
        take: fetchTake,
        orderBy,
        include: {
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
          center: { select: { id: true, name: true } },
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
        },
      }),
      this.prisma.student.count({ where }),
      // Calculate total monthly fees using aggregate (SUM) with same filters, independent of pagination
      this.prisma.student.aggregate({
        where,
        _sum: {
          monthlyFee: true,
        },
      }),
    ]);

    const sortedItems = items;
    // In-memory sort only for absence (already ordered by DB for student/monthlyFee/register)

    // Extract total monthly fees from aggregate result
    const totalMonthlyFees = totalMonthlyFeesResult._sum?.monthlyFee 
      ? Number(totalMonthlyFeesResult._sum.monthlyFee) 
      : 0;

    // Calculate attendance data for the selected month
    // If month/year not provided, use current month
    const now = new Date();
    const selectedMonth = params?.month ?? now.getMonth() + 1; // 1-12 (January-December)
    const selectedYear = params?.year ?? now.getFullYear();
    
    // Calculate date range for the selected month
    // JavaScript Date months are 0-indexed (0-11), so we subtract 1
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    // Get the last day of the month by going to the first day of next month and subtracting 1 day
    const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

    // Get all student IDs from the fetched items
    const studentIds = sortedItems.map(item => item.id);

    // Calculate attendance data efficiently using aggregation
    // For each student, we need:
    // 1. Total classes = count of lessons in their group within the month
    // 2. Absences = count of attendance records marked as absent (isPresent = false) within the month
    // Note: If attendance is not marked for a session, it's not counted as absence (only explicitly marked absences count)
    
    const attendanceDataMap = new Map<string, { totalClasses: number; absences: number }>();
    const justifiedAbsencesMap = new Map<string, number>();
    const unjustifiedAbsencesMap = new Map<string, number>();

    if (studentIds.length > 0) {
      // Get all groups for these students
      const studentGroups = new Map<string, string | null>();
      const groupToStudents = new Map<string, string[]>(); // Map groupId to array of studentIds
      sortedItems.forEach(student => {
        studentGroups.set(student.id, student.groupId);
        if (student.groupId) {
          if (!groupToStudents.has(student.groupId)) {
            groupToStudents.set(student.groupId, []);
          }
          groupToStudents.get(student.groupId)!.push(student.id);
        }
      });

      // Get all unique group IDs
      const uniqueGroupIds = Array.from(groupToStudents.keys());

      // Fetch total classes per group in a single query (grouped by groupId)
      // Then distribute to students in those groups
      const groupClassesMap = new Map<string, number>();
      if (uniqueGroupIds.length > 0) {
        const groupClassesResults = await Promise.all(
          uniqueGroupIds.map(async (groupId) => {
            const count = await this.prisma.lesson.count({
              where: {
                groupId,
                scheduledAt: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            });
            return { groupId, count };
          })
        );
        groupClassesResults.forEach(({ groupId, count }) => {
          groupClassesMap.set(groupId, count);
        });
      }

      // Fetch absences for all students grouped by absenceType so we can
      // distinguish excused vs unexcused absences for risk-label logic.
      const absencesResults = await this.prisma.attendance.groupBy({
        by: ['studentId', 'absenceType'],
        where: {
          studentId: { in: studentIds },
          isPresent: false,
          lesson: {
            scheduledAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
        _count: true,
      });

      // Build absences maps (total + by type)
      const absencesMap = new Map<string, number>();
      absencesResults.forEach((result) => {
        const prev = absencesMap.get(result.studentId) ?? 0;
        absencesMap.set(result.studentId, prev + result._count);
        if (result.absenceType === 'UNJUSTIFIED') {
          unjustifiedAbsencesMap.set(
            result.studentId,
            (unjustifiedAbsencesMap.get(result.studentId) ?? 0) + result._count,
          );
        } else if (result.absenceType === 'JUSTIFIED') {
          justifiedAbsencesMap.set(
            result.studentId,
            (justifiedAbsencesMap.get(result.studentId) ?? 0) + result._count,
          );
        }
      });

      // Combine data for each student
      studentIds.forEach((studentId) => {
        const groupId = studentGroups.get(studentId);
        const totalClasses = groupId ? (groupClassesMap.get(groupId) || 0) : 0;
        const absences = absencesMap.get(studentId) || 0;
        attendanceDataMap.set(studentId, { totalClasses, absences });
      });
    }

    // Add attendance data to each student item, plus a derived risk label
    // computed from absence breakdown (per ilona.md):
    //   > 1 unjustified absence → HIGH_RISK
    //   > 1 justified absence   → RISK
    //   otherwise               → NONE
    const recentPaidCutoffDate = new Date();
    recentPaidCutoffDate.setDate(
      recentPaidCutoffDate.getDate() - NEW_PAID_STUDENT_LABEL_DAYS,
    );

    let itemsWithAttendance = sortedItems.map((student) => {
      const attendance = attendanceDataMap.get(student.id) || {
        totalClasses: 0,
        absences: 0,
      };
      const justified = justifiedAbsencesMap.get(student.id) ?? 0;
      const unjustified = unjustifiedAbsencesMap.get(student.id) ?? 0;
      const derivedRisk: RiskLabel =
        unjustified > 1
          ? RiskLabel.HIGH_RISK
          : justified > 1
            ? RiskLabel.RISK
            : RiskLabel.NONE;
      const activationDate = student.enrolledAt ?? student.createdAt;
      const newBadgeExpiresAt = new Date(activationDate);
      newBadgeExpiresAt.setDate(
        newBadgeExpiresAt.getDate() + NEW_PAID_STUDENT_LABEL_DAYS,
      );
      const isRecentlyPaidFromCrm =
        Boolean(student.leadId) && activationDate >= recentPaidCutoffDate;
      return {
        ...student,
        attendanceSummary: {
          totalClasses: attendance.totalClasses,
          absences: attendance.absences,
          justifiedAbsences: justified,
          unjustifiedAbsences: unjustified,
        },
        derivedRiskLabel: derivedRisk,
        isRecentlyPaidFromCrm,
        newBadgeExpiresAt,
      };
    });

    // Apply in-memory sorting for absence if needed (after attendance data is calculated)
    if (shouldSortInMemory && sortBy === 'absence') {
      itemsWithAttendance = [...itemsWithAttendance].sort((a, b) => {
        // Get absences count, treating null/0 totalClasses as 0 absences for sorting stability
        const aAbsences = (a.attendanceSummary?.totalClasses === 0 || !a.attendanceSummary?.totalClasses) 
          ? 0 
          : (a.attendanceSummary?.absences || 0);
        const bAbsences = (b.attendanceSummary?.totalClasses === 0 || !b.attendanceSummary?.totalClasses) 
          ? 0 
          : (b.attendanceSummary?.absences || 0);
        
        const comparison = aAbsences - bAbsences;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      // Apply pagination after sorting
      itemsWithAttendance = itemsWithAttendance.slice(skip, skip + take);
    }

    return {
      items: itemsWithAttendance,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
      totalMonthlyFees,
    };
  }
}
