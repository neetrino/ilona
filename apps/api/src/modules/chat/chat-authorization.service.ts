import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service responsible for chat authorization and access control
 */
@Injectable()
export class ChatAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Centralized authorization check: Can a teacher access a group chat?
   *
   * A teacher can access a group chat if:
   * 1. They are the assigned group teacher (Group.teacherId === Teacher.id), OR
   * 2. They are the group's substitute teacher (Group.substituteTeacherId), OR
   * 3. They have lessons in that group as primary teacher (Lesson.teacherId), OR
   * 4. They cover at least one lesson in that group as substitute (Lesson.substituteTeacherId)
   *
   * This is the canonical source of truth for teacher->group chat access.
   *
   * @param teacherUserId - The User.id of the teacher
   * @param groupId - The Group.id to check access for
   * @returns Object with access boolean and debug context (for dev logging)
   */
  async canTeacherAccessGroupChat(
    teacherUserId: string,
    groupId: string,
  ): Promise<{
    hasAccess: boolean;
    debug?: {
      teacherId?: string;
      groupTeacherId?: string | null;
      groupSubstituteTeacherId?: string | null;
      hasLessons: boolean;
      hasSubstituteLessons: boolean;
    };
  }> {
    // Get teacher entity
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacher) {
      return {
        hasAccess: false,
        debug: {
          teacherId: undefined,
          groupTeacherId: undefined,
          groupSubstituteTeacherId: undefined,
          hasLessons: false,
          hasSubstituteLessons: false,
        },
      };
    }

    // Get group with teacher assignment
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { teacherId: true, substituteTeacherId: true },
    });

    if (!group) {
      return {
        hasAccess: false,
        debug: {
          teacherId: teacher.id,
          groupTeacherId: undefined,
          groupSubstituteTeacherId: undefined,
          hasLessons: false,
          hasSubstituteLessons: false,
        },
      };
    }

    const isGroupTeacher = group.teacherId === teacher.id;
    const isGroupSubstitute = group.substituteTeacherId === teacher.id;

    const [primaryLessonCount, substituteLessonCount] = await Promise.all([
      this.prisma.lesson.count({
        where: {
          groupId,
          teacherId: teacher.id,
        },
      }),
      this.prisma.lesson.count({
        where: {
          groupId,
          substituteTeacherId: teacher.id,
        },
      }),
    ]);

    const hasLessons = primaryLessonCount > 0;
    const hasSubstituteLessons = substituteLessonCount > 0;

    const hasAccess = isGroupTeacher || isGroupSubstitute || hasLessons || hasSubstituteLessons;

    return {
      hasAccess,
      debug: {
        teacherId: teacher.id,
        groupTeacherId: group.teacherId,
        groupSubstituteTeacherId: group.substituteTeacherId,
        hasLessons,
        hasSubstituteLessons,
      },
    };
  }

  /**
   * Ensure teacher is added as ChatParticipant for a group chat if they're assigned
   */
  async ensureTeacherInGroupChat(chatId: string, teacherUserId: string): Promise<void> {
    // Check if teacher is already a participant
    const existingParticipant = await this.prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: teacherUserId,
        },
      },
    });

    if (existingParticipant && !existingParticipant.leftAt) {
      // Already a participant, just ensure isAdmin is true
      if (!existingParticipant.isAdmin) {
        await this.prisma.chatParticipant.update({
          where: {
            chatId_userId: {
              chatId,
              userId: teacherUserId,
            },
          },
          data: { isAdmin: true },
        });
      }
      return;
    }

    // Add or rejoin teacher as admin
    await this.prisma.chatParticipant.upsert({
      where: {
        chatId_userId: {
          chatId,
          userId: teacherUserId,
        },
      },
      update: {
        leftAt: null,
        isAdmin: true,
      },
      create: {
        chatId,
        userId: teacherUserId,
        isAdmin: true,
      },
    });
  }

  /**
   * Validate if a student can DM a teacher
   */
  async validateStudentTeacherDM(studentUserId: string, teacherUserId: string): Promise<boolean> {
    // Get student profile
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      select: { id: true, teacherId: true, groupId: true },
    });

    if (!student) {
      return false;
    }

    // Get teacher profile
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacher) {
      return false;
    }

    // Check direct assignment
    if (student.teacherId === teacher.id) {
      return true;
    }

    // Check group assignment
    if (student.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: student.groupId },
        select: { teacherId: true },
      });

      if (group?.teacherId === teacher.id) {
        return true;
      }
    }

    return false;
  }
}

