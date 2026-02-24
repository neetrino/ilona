import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('lesson/:lessonId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getByLesson(@Param('lessonId') lessonId: string) {
    return this.feedbackService.getByLesson(lessonId);
  }

  @Get('student/:studentId')
  async getByStudent(
    @Param('studentId') studentId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.feedbackService.getByStudent(studentId, {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      teacherId: teacherId || undefined,
    });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async createOrUpdate(
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbackService.createOrUpdate(
      dto,
      user.sub,
      user.role as UserRole,
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbackService.update(id, dto, user.sub, user.role as UserRole);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbackService.delete(id, user.sub, user.role as UserRole);
  }
}

