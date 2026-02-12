import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  QueryLessonDto,
  CompleteLessonDto,
  CreateRecurringLessonDto,
} from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, LessonStatus } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  async findAll(@Query() query: QueryLessonDto) {
    return this.lessonsService.findAll({
      skip: query.skip,
      take: query.take,
      groupId: query.groupId,
      teacherId: query.teacherId,
      status: query.status as LessonStatus,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    });
  }

  @Get('my-lessons')
  @Roles(UserRole.TEACHER)
  async getMyLessons(@CurrentUser() user: JwtPayload, @Query() query: QueryLessonDto) {
    const teacher = await this.lessonsService['prisma'].teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return { items: [], total: 0 };
    }

    return this.lessonsService.findByTeacher(
      teacher.id,
      query.dateFrom ? new Date(query.dateFrom) : undefined,
      query.dateTo ? new Date(query.dateTo) : undefined,
    );
  }

  @Get('today')
  @Roles(UserRole.TEACHER)
  async getTodayLessons(@CurrentUser() user: JwtPayload) {
    const teacher = await this.lessonsService['prisma'].teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return [];
    }

    return this.lessonsService.getTodayLessons(teacher.id);
  }

  @Get('upcoming')
  @Roles(UserRole.TEACHER)
  async getUpcomingLessons(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number) {
    const teacher = await this.lessonsService['prisma'].teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return [];
    }

    return this.lessonsService.getUpcoming(teacher.id, limit || 10);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getStatistics(@CurrentUser() user: JwtPayload, @Query() query: QueryLessonDto) {
    let teacherId: string | undefined;

    if (user.role === UserRole.TEACHER) {
      const teacher = await this.lessonsService['prisma'].teacher.findUnique({
        where: { userId: user.sub },
      });
      teacherId = teacher?.id;
    } else if (query.teacherId) {
      teacherId = query.teacherId;
    }

    return this.lessonsService.getLessonStatistics(
      teacherId,
      query.dateFrom ? new Date(query.dateFrom) : undefined,
      query.dateTo ? new Date(query.dateTo) : undefined,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Post('recurring')
  @Roles(UserRole.ADMIN)
  async createRecurring(@Body() dto: CreateRecurringLessonDto) {
    return this.lessonsService.createRecurring({
      groupId: dto.groupId,
      teacherId: dto.teacherId,
      schedule: dto.schedule,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      duration: dto.duration,
      topic: dto.topic,
    });
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @Patch(':id/start')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async startLesson(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.lessonsService.startLesson(id, user.sub, user.role);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async completeLesson(
    @Param('id') id: string,
    @Body() dto: CompleteLessonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.completeLesson(id, dto, user.sub, user.role);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  async cancelLesson(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.lessonsService.cancelLesson(id, reason);
  }

  @Patch(':id/vocabulary-sent')
  @Roles(UserRole.TEACHER)
  async markVocabularySent(@Param('id') id: string) {
    return this.lessonsService.markVocabularySent(id);
  }

  @Patch(':id/absence-complete')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async markAbsenceComplete(@Param('id') id: string) {
    return this.lessonsService.markAbsenceComplete(id);
  }

  @Patch(':id/voice-sent')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async markVoiceSent(@Param('id') id: string) {
    return this.lessonsService.markVoiceSent(id);
  }

  @Patch(':id/text-sent')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async markTextSent(@Param('id') id: string) {
    return this.lessonsService.markTextSent(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }
}
