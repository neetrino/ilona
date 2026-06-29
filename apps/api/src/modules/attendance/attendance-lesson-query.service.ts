import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { teacherActsAsLessonInstructor } from '../../common/lesson-instructor';
import { AttendanceScopeService } from './attendance-scope.service';

@Injectable()
export class AttendanceLessonQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: AttendanceScopeService,
  ) {}
  async getByLesson(lessonId: string, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.scope.getManagerCenterId(userId, userRole);
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        attendances: {
          include: {
            markedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            student: {
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
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Authorization: Teachers can only access lessons for their assigned groups
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || !teacherActsAsLessonInstructor(lesson, teacher.id)) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    }

    if (managerCenterId && lesson.group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this lesson');
    }

    // Combine students with their attendance records
    const studentsWithAttendance = lesson.group.students.map((student) => {
      const attendance = lesson.attendances.find((a) => a.studentId === student.id);
      return {
        student,
        attendance: attendance || null,
      };
    });

    return {
      lesson: {
        id: lesson.id,
        scheduledAt: lesson.scheduledAt,
        topic: lesson.topic,
        status: lesson.status,
      },
      studentsWithAttendance,
      summary: {
        total: studentsWithAttendance.length,
        present: lesson.attendances.filter((a) => a.isPresent).length,
        absent: lesson.attendances.filter((a) => !a.isPresent).length,
        notMarked: studentsWithAttendance.length - lesson.attendances.length,
      },
    };
  }

  /**
   * Get attendance for multiple lessons in one request (batch). Returns a map of lessonId -> lesson attendance.
   * Lessons not found or not authorized are omitted from the result.
   */
  async getByLessons(lessonIds: string[], userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.scope.getManagerCenterId(userId, userRole);
    if (!lessonIds || lessonIds.length === 0) {
      return {};
    }
    const uniqueIds = [...new Set(lessonIds)];
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: uniqueIds } },
      include: {
        group: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        attendances: {
          include: {
            markedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            student: {
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
          },
        },
      },
    });

    let teacherId: string | null = null;
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });
      teacherId = teacher?.id ?? null;
    }

    const result: Record<string, Awaited<ReturnType<AttendanceLessonQueryService['getByLesson']>>> = {};
    for (const lesson of lessons) {
      if (teacherId !== null && !teacherActsAsLessonInstructor(lesson, teacherId)) {
        continue;
      }
      if (managerCenterId && lesson.group.centerId !== managerCenterId) {
        continue;
      }
      const studentsWithAttendance = lesson.group.students.map((student) => {
        const attendance = lesson.attendances.find((a) => a.studentId === student.id);
        return {
          student,
          attendance: attendance || null,
        };
      });
      result[lesson.id] = {
        lesson: {
          id: lesson.id,
          scheduledAt: lesson.scheduledAt,
          topic: lesson.topic,
          status: lesson.status,
        },
        studentsWithAttendance,
        summary: {
          total: studentsWithAttendance.length,
          present: lesson.attendances.filter((a) => a.isPresent).length,
          absent: lesson.attendances.filter((a) => !a.isPresent).length,
          notMarked: studentsWithAttendance.length - lesson.attendances.length,
        },
      };
    }
    return result;
  }
}
