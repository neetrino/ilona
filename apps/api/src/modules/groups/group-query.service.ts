import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { assertManagerCenterAccess } from '../../common/utils/manager-scope.util';
import { GroupAccessService } from './group-access.service';
import { groupDetailInclude, groupListInclude } from './group-query-includes';

@Injectable()
export class GroupQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: GroupAccessService,
  ) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    centerId?: string;
    teacherId?: string;
    isActive?: boolean;
    level?: string;
    includeStudents?: boolean;
    currentUser?: JwtPayload;
  }) {
    const {
      skip = 0,
      take = 50,
      search,
      centerId,
      teacherId,
      isActive,
      level,
      includeStudents,
      currentUser,
    } = params || {};

    const where: Prisma.GroupWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const scopedCenterId = assertManagerCenterAccess(currentUser, centerId);
    if (scopedCenterId) where.centerId = scopedCenterId;
    if (teacherId) {
      where.OR = [{ teacherId }, { secondTeacherId: teacherId }];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (level) where.level = level;

    const [items, total] = await Promise.all([
      this.prisma.prismaWithRetry(
        () =>
          this.prisma.group.findMany({
            where,
            skip,
            take,
            orderBy: { name: 'asc' },
            include: groupListInclude(includeStudents),
          }),
        { op: 'groups.findAll', meta: { skip, take, teacherId, centerId } },
      ),
      this.prisma.prismaWithRetry(
        () => this.prisma.group.count({ where }),
        { op: 'groups.findAll.count', meta: { teacherId, centerId } },
      ),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findStudentsByGroupId(
    groupId: string,
    params?: { skip?: number; take?: number },
    currentUser?: JwtPayload,
  ) {
    const { skip = 0, take = 20 } = params || {};
    await this.findById(groupId, currentUser);

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where: { groupId },
        skip,
        take,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.student.count({ where: { groupId } }),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string, currentUser?: JwtPayload) {
    await this.accessService.assertManagerGroupAccess(id, currentUser);

    const group = await this.prisma.group.findUnique({
      where: { id },
      include: groupDetailInclude,
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async getTeacherByUserId(userId: string) {
    return this.prisma.prismaWithRetry(
      () =>
        this.prisma.teacher.findUnique({
          where: { userId },
          select: { id: true },
        }),
      { op: 'groups.getTeacherByUserId', meta: { userId } },
    );
  }

  async findByTeacher(teacherId: string) {
    const groups = await this.prisma.prismaWithRetry(
      () =>
        this.prisma.group.findMany({
          where: {
            isActive: true,
            OR: [{ teacherId }, { secondTeacherId: teacherId }],
          },
          include: {
            center: { select: { id: true, name: true } },
            teacher: {
              select: {
                id: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
            secondTeacher: {
              select: {
                id: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
            _count: { select: { lessons: true } },
          },
          orderBy: { name: 'asc' },
        }),
      { op: 'groups.findByTeacher', meta: { teacherId } },
    );

    const groupIds = groups.map((g) => g.id);
    if (groupIds.length === 0) return [];

    const activeStudentCounts = await this.prisma.prismaWithRetry(
      () =>
        this.prisma.student.groupBy({
          by: ['groupId'],
          where: {
            groupId: { in: groupIds },
            user: { status: 'ACTIVE' },
          },
          _count: { id: true },
        }),
      { op: 'groups.findByTeacher.studentCount', meta: { teacherId, groupCount: groupIds.length } },
    );

    const countMap = new Map(activeStudentCounts.map((item) => [item.groupId, item._count.id]));

    return groups.map((group) => ({
      ...group,
      _count: {
        ...group._count,
        students: countMap.get(group.id) || 0,
      },
    }));
  }

  async findByTeacherUserId(userId: string) {
    const teacher = await this.getTeacherByUserId(userId);
    if (!teacher) return [];
    return this.findByTeacher(teacher.id);
  }
}
