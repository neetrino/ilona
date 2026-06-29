import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
import { TeacherAccessService } from './teacher-access.service';

@Injectable()
export class TeacherReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: TeacherAccessService,
  ) {}

  async findById(id: string, currentUser?: JwtPayload) {
    await this.accessService.assertManagerTeacherAccess(id, currentUser);

    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
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
        groups: {
          include: {
            center: { select: { id: true, name: true } },
            _count: { select: { students: true } },
          },
        },
        secondTeacherForGroups: {
          include: {
            center: { select: { id: true, name: true } },
            _count: { select: { students: true } },
          },
        },
        centerLinks: {
          select: { center: { select: { id: true, name: true } } },
        },
        _count: {
          select: { groups: true, lessons: true, feedbacks: true, secondTeacherForGroups: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
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
          },
        },
        groups: {
          include: {
            center: { select: { id: true, name: true } },
            _count: { select: { students: true, lessons: true } },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return teacher;
  }
}
