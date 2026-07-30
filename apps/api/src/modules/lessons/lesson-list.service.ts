import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, LessonStatus, UserRole } from '@ilona/database';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { LessonManagerAccessService } from './lesson-manager-access.service';
import { lessonsAccessibleToTeacherWhere, lessonsPayableToTeacherWhere } from '../../common/lesson-instructor';

@Injectable()
export class LessonListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichmentService: LessonEnrichmentService,
    private readonly managerAccessService: LessonManagerAccessService,
  ) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    centerId?: string;
    groupId?: string;
    groupIds?: string[];
    teacherId?: string;
    teacherIds?: string[];
    status?: LessonStatus;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    currentUserId?: string;
    userRole?: UserRole;
  }) {
    const {
      skip = 0,
      take = 50,
      centerId: centerIdParam,
      groupId,
      groupIds,
      teacherId,
      teacherIds,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      search,
      currentUserId,
      userRole,
    } = params || {};

    const where: Prisma.LessonWhereInput = {};

    let roleScopeCondition: Prisma.LessonWhereInput | null = null;
    let currentTeacherId: string | null = null;

    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });

      if (teacher) {
        currentTeacherId = teacher.id;
        roleScopeCondition = lessonsAccessibleToTeacherWhere(teacher.id);
      } else {
        return {
          items: [],
          total: 0,
          page: 1,
          pageSize: take,
          totalPages: 0,
        };
      }
    }

    if (userRole === UserRole.MANAGER && currentUserId) {
      const managerCenterId = await this.managerAccessService.getManagerCenterId(
        currentUserId,
        userRole,
      );
      if (managerCenterId) {
        roleScopeCondition = {
          group: {
            centerId: managerCenterId,
          },
        };
      }
    }

    if (userRole === UserRole.STUDENT && currentUserId) {
      const student = await this.prisma.student.findUnique({
        where: { userId: currentUserId },
        select: { id: true, groupId: true },
      });
      if (!student?.groupId) {
        return {
          items: [],
          total: 0,
          page: 1,
          pageSize: take,
          totalPages: 0,
        };
      }
      roleScopeCondition = { groupId: student.groupId };
    }

    const filterConditions: Prisma.LessonWhereInput[] = [];

    if (roleScopeCondition) {
      filterConditions.push(roleScopeCondition);
    }

    const additionalFilters: Prisma.LessonWhereInput = {};
    let teacherScopeFilter: Prisma.LessonWhereInput | null = null;
    if (userRole === UserRole.ADMIN) {
      if (centerIdParam) {
        const groupIs: Prisma.GroupWhereInput = { centerId: centerIdParam };
        if (groupIds && groupIds.length > 0) {
          groupIs.id = { in: groupIds };
        } else if (groupId) {
          groupIs.id = groupId;
        }
        additionalFilters.group = { is: groupIs };
      } else {
        if (groupIds && groupIds.length > 0) {
          additionalFilters.groupId = { in: groupIds };
        } else if (groupId) {
          additionalFilters.groupId = groupId;
        }
      }
    } else if (userRole !== UserRole.STUDENT) {
      if (groupIds && groupIds.length > 0) {
        additionalFilters.groupId = { in: groupIds };
      } else if (groupId) {
        additionalFilters.groupId = groupId;
      }
    }
    if (teacherIds && teacherIds.length > 0) {
      if (userRole === UserRole.TEACHER && currentTeacherId && !teacherIds.includes(currentTeacherId)) {
        throw new ForbiddenException('You can only view your own lessons');
      }
      if (userRole !== UserRole.TEACHER) {
        if (teacherIds.length === 1) {
          const id = teacherIds[0];
          teacherScopeFilter = { OR: [{ teacherId: id }, { substituteTeacherId: id }] };
        } else {
          teacherScopeFilter = {
            OR: [
              { teacherId: { in: teacherIds } },
              { substituteTeacherId: { in: teacherIds } },
            ],
          };
        }
      }
    } else if (teacherId) {
      if (userRole === UserRole.TEACHER && currentTeacherId && teacherId !== currentTeacherId) {
        throw new ForbiddenException('You can only view your own lessons');
      }
      if (userRole !== UserRole.TEACHER) {
        teacherScopeFilter = { OR: [{ teacherId }, { substituteTeacherId: teacherId }] };
      }
    }
    if (status) additionalFilters.status = status;

    if (dateFrom || dateTo) {
      additionalFilters.scheduledAt = {};
      if (dateFrom) additionalFilters.scheduledAt.gte = dateFrom;
      if (dateTo) additionalFilters.scheduledAt.lte = dateTo;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchScopeFilter: Prisma.LessonWhereInput = {
        OR: [
          { topic: { contains: searchTerm, mode: 'insensitive' } },
          { group: { name: { contains: searchTerm, mode: 'insensitive' } } },
          {
            teacher: {
              user: {
                OR: [
                  { firstName: { contains: searchTerm, mode: 'insensitive' } },
                  { lastName: { contains: searchTerm, mode: 'insensitive' } },
                ],
              },
            },
          },
          {
            substituteTeacher: {
              user: {
                OR: [
                  { firstName: { contains: searchTerm, mode: 'insensitive' } },
                  { lastName: { contains: searchTerm, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      };

      if (teacherScopeFilter) {
        additionalFilters.AND = [teacherScopeFilter, searchScopeFilter];
      } else {
        Object.assign(additionalFilters, searchScopeFilter);
      }
    } else if (teacherScopeFilter) {
      Object.assign(additionalFilters, teacherScopeFilter);
    }

    if (filterConditions.length > 0 || Object.keys(additionalFilters).length > 0) {
      if (filterConditions.length > 0 && Object.keys(additionalFilters).length > 0) {
        where.AND = [...filterConditions, additionalFilters];
      } else if (filterConditions.length > 0) {
        Object.assign(where, filterConditions[0]);
      } else {
        Object.assign(where, additionalFilters);
      }
    }

    let orderBy: Prisma.LessonOrderByWithRelationInput;
    if (sortBy === 'scheduledAt' || sortBy === 'dateTime') {
      orderBy = { scheduledAt: sortOrder || 'desc' };
    } else {
      orderBy = { scheduledAt: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              level: true,
              center: { select: { id: true, name: true } },
              teacher: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              secondTeacher: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          substituteTeacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              attendances: true,
              feedbacks: true,
            },
          },
          dailyPlan: {
            select: { id: true, createdAt: true },
          },
          feedbacks: {
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    const enrichedItems = items.map((lesson) => this.enrichmentService.enrichLesson(lesson));

    return {
      items: enrichedItems,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findByTeacher(teacherId: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.LessonWhereInput = {
      ...lessonsPayableToTeacherWhere(teacherId),
    };

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = dateFrom;
      if (dateTo) where.scheduledAt.lte = dateTo;
    }

    const lessons = await this.prisma.lesson.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            center: { select: { id: true, name: true } },
            _count: { select: { students: true } },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        substituteTeacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { attendances: true, feedbacks: true },
        },
        dailyPlan: {
          select: { id: true, createdAt: true },
        },
        feedbacks: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const enrichedItems = lessons.map((lesson) => this.enrichmentService.enrichLesson(lesson));
    return {
      items: enrichedItems,
      total: enrichedItems.length,
      page: 1,
      pageSize: enrichedItems.length,
      totalPages: 1,
    };
  }

  async getTodayLessons(teacherId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.findByTeacher(teacherId, today, tomorrow);
  }

  async getUpcoming(teacherId: string, limit = 10) {
    const now = new Date();

    return this.prisma.lesson.findMany({
      where: {
        ...lessonsPayableToTeacherWhere(teacherId),
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      take: limit,
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: { select: { students: true } },
          },
        },
      },
    });
  }
}
