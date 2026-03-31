import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, BulkAttendanceDto, QueryAttendanceDto, CreatePlannedAbsenceDto } from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, AbsenceType } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('my/calendar')
  @Roles(UserRole.STUDENT)
  async getMyCalendar(@CurrentUser() user: JwtPayload, @Query() query: QueryAttendanceDto) {
    const student = await this.prisma.student.findFirst({
      where: { userId: user.sub },
    });

    if (!student) {
      return {
        lessons: [],
        attendances: [],
        plannedAbsences: [],
        statistics: {
          total: 0,
          present: 0,
          absent: 0,
          absentJustified: 0,
          absentUnjustified: 0,
          attendanceRate: 100,
        },
      };
    }

    return this.attendanceService.getStudentCalendarMonth(student.id, {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    });
  }

  @Post('my/planned-absence')
  @Roles(UserRole.STUDENT)
  async createMyPlannedAbsence(@CurrentUser() user: JwtPayload, @Body() dto: CreatePlannedAbsenceDto) {
    return this.attendanceService.createPlannedAbsenceForStudentUser(user.sub, dto.date, dto.comment);
  }

  @Delete('my/planned-absence/:id')
  @Roles(UserRole.STUDENT)
  async deleteMyPlannedAbsence(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.attendanceService.deleteMyPlannedAbsence(user.sub, id);
  }

  @Get('planned-absences')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async listPlannedAbsences(@CurrentUser() user: JwtPayload, @Query() query: QueryAttendanceDto) {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date();
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();
    if (!query.dateFrom) {
      dateFrom.setHours(0, 0, 0, 0);
    }
    if (!query.dateTo) {
      dateTo.setDate(dateTo.getDate() + 30);
      dateTo.setHours(23, 59, 59, 999);
    }
    return this.attendanceService.listPlannedAbsencesForStaff(dateFrom, dateTo, user.sub, user.role);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  async getMyAttendance(@CurrentUser() user: JwtPayload) {
    // Find student by user ID
    const student = await this.prisma.student.findFirst({
      where: { userId: user.sub },
    });

    if (!student) {
      return {
        attendances: [],
        statistics: {
          total: 0,
          present: 0,
          absent: 0,
          absentJustified: 0,
          absentUnjustified: 0,
          attendanceRate: 100,
        },
      };
    }

    return this.attendanceService.getByStudent(student.id, {});
  }

  @Get('lessons')
  async getByLessons(
    @Query('lessonIds') lessonIdsParam: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<unknown> {
    const lessonIds = lessonIdsParam ? lessonIdsParam.split(',').map((id) => id.trim()).filter(Boolean) : [];
    return this.attendanceService.getByLessons(lessonIds, user?.sub, user?.role);
  }

  @Get('lesson/:lessonId')
  async getByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<unknown> {
    return this.attendanceService.getByLesson(lessonId, user?.sub, user?.role);
  }

  @Get('student/:studentId')
  async getByStudent(
    @Param('studentId') studentId: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendanceService.getByStudent(studentId, {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    });
  }

  @Get('group/:groupId/report')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async getGroupReport(
    @Param('groupId') groupId: string,
    @Query() query: QueryAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    return this.attendanceService.getGroupAttendanceReport(groupId, dateFrom, dateTo, user.sub, user.role);
  }

  @Get('at-risk')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAtRiskStudents(@CurrentUser() user: JwtPayload) {
    return this.attendanceService.getAtRiskStudents(undefined, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async markAttendance(
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.attendanceService.markAttendance(dto, user.sub, user.role);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async markBulkAttendance(
    @Body() dto: BulkAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.attendanceService.markBulkAttendance(dto, user.sub, user.role);
  }

  @Patch(':id/absence-type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async updateAbsenceType(
    @Param('id') id: string,
    @Body('absenceType') absenceType: AbsenceType,
    @Body('note') note: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.updateAbsenceType(id, absenceType, note, user.sub, user.role);
  }
}

