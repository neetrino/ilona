import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentNoteDto } from './dto/create-student-note.dto';

@Injectable()
export class StudentNotesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveStudentId(userId: string): Promise<string> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) {
      throw new ForbiddenException('Student profile not found');
    }
    return student.id;
  }

  async listForUser(userId: string) {
    const studentId = await this.resolveStudentId(userId);
    return this.prisma.studentNote.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createForUser(userId: string, dto: CreateStudentNoteDto) {
    const studentId = await this.resolveStudentId(userId);
    return this.prisma.studentNote.create({
      data: {
        studentId,
        content: dto.content.trim(),
      },
    });
  }

  async removeForUser(userId: string, noteId: string) {
    const studentId = await this.resolveStudentId(userId);
    const note = await this.prisma.studentNote.findUnique({ where: { id: noteId } });
    if (!note || note.studentId !== studentId) {
      throw new NotFoundException('Note not found');
    }
    await this.prisma.studentNote.delete({ where: { id: noteId } });
    return { success: true };
  }
}
