import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherNoteDto } from './dto/create-teacher-note.dto';

@Injectable()
export class TeacherNotesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveTeacherId(userId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) {
      throw new ForbiddenException('Teacher profile not found');
    }
    return teacher.id;
  }

  async listForUser(userId: string) {
    const teacherId = await this.resolveTeacherId(userId);
    return this.prisma.teacherNote.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createForUser(userId: string, dto: CreateTeacherNoteDto) {
    const teacherId = await this.resolveTeacherId(userId);
    return this.prisma.teacherNote.create({
      data: {
        teacherId,
        content: dto.content.trim(),
      },
    });
  }

  async removeForUser(userId: string, noteId: string) {
    const teacherId = await this.resolveTeacherId(userId);
    const note = await this.prisma.teacherNote.findUnique({ where: { id: noteId } });
    if (!note || note.teacherId !== teacherId) {
      throw new NotFoundException('Note not found');
    }
    await this.prisma.teacherNote.delete({ where: { id: noteId } });
    return { success: true };
  }
}
