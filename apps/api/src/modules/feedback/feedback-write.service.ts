import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto';
import { UserRole } from '@ilona/database';
import { teacherActsAsLessonInstructor } from '../../common/lesson-instructor';
import { buildStructuredFields } from './feedback.util';
import { FeedbackCompletionService } from './feedback-completion.service';

@Injectable()
export class FeedbackWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly completionService: FeedbackCompletionService,
  ) {}

  async createOrUpdate(
    dto: CreateFeedbackDto,
    userId: string,
    userRole: UserRole,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: {
        teacher: true,
        group: {
          include: {
            students: {
              where: { id: dto.studentId },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${dto.lessonId} not found`);
    }

    if (lesson.group.students.length === 0) {
      throw new BadRequestException('Student is not in this lesson\'s group');
    }

    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || !teacherActsAsLessonInstructor(lesson, teacher.id)) {
        throw new ForbiddenException('You are not assigned to this lesson');
      }
    }

    const existingFeedback = await this.prisma.feedback.findUnique({
      where: {
        lessonId_studentId: {
          lessonId: dto.lessonId,
          studentId: dto.studentId,
        },
      },
    });

    const feedbackData = {
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      rating: dto.rating,
      strengths: dto.strengths,
      improvements: dto.improvements,
      ...buildStructuredFields(dto),
    };

    let result;

    if (existingFeedback) {
      result = await this.prisma.feedback.update({
        where: { id: existingFeedback.id },
        data: feedbackData,
      });
    } else {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher not found');
      }

      result = await this.prisma.feedback.create({
        data: {
          lessonId: dto.lessonId,
          studentId: dto.studentId,
          teacherId: teacher.id,
          content: dto.content ?? '',
          rating: dto.rating,
          strengths: dto.strengths,
          improvements: dto.improvements,
          ...(dto.level ? { level: dto.level } : {}),
          ...(dto.grammarTopics ? { grammarTopics: dto.grammarTopics } : {}),
          ...(dto.skills ? { skills: dto.skills } : {}),
          ...(dto.skillsNote !== undefined ? { skillsNote: dto.skillsNote } : {}),
          ...(dto.participation !== undefined ? { participation: dto.participation } : {}),
          ...(dto.progress !== undefined ? { progress: dto.progress } : {}),
          ...(dto.encouragement !== undefined ? { encouragement: dto.encouragement } : {}),
        },
      });
    }

    await this.completionService.syncLessonFeedbacksCompleted(dto.lessonId);
    return result;
  }

  async update(
    id: string,
    dto: UpdateFeedbackDto,
    userId: string,
    userRole: UserRole,
  ) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            teacher: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== feedback.teacherId) {
        throw new ForbiddenException('You can only edit your own feedback');
      }
    }

    return this.prisma.feedback.update({
      where: { id },
      data: {
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        rating: dto.rating,
        strengths: dto.strengths,
        improvements: dto.improvements,
        ...buildStructuredFields(dto),
      },
    });
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== feedback.teacherId) {
        throw new ForbiddenException('You can only delete your own feedback');
      }
    }

    await this.prisma.feedback.delete({
      where: { id },
    });

    await this.completionService.syncLessonFeedbacksCompleted(feedback.lessonId);
    return feedback;
  }
}
