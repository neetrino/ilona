import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, BulkAttendanceDto, QueryAttendanceDto } from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, AbsenceType } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Get('lesson/:lessonId')
  async getByLesson(@Param('lessonId') lessonId: string) {
    return this.attendanceService.getByLesson(lessonId);
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
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getGroupReport(
    @Param('groupId') groupId: string,
    @Query() query: QueryAttendanceDto,
  ) {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    return this.attendanceService.getGroupAttendanceReport(groupId, dateFrom, dateTo);
  }

  @Get('at-risk')
  @Roles(UserRole.ADMIN)
  async getAtRiskStudents() {
    return this.attendanceService.getAtRiskStudents();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async markAttendance(@Body() dto: MarkAttendanceDto) {
    return this.attendanceService.markAttendance(dto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async markBulkAttendance(@Body() dto: BulkAttendanceDto) {
    return this.attendanceService.markBulkAttendance(dto);
  }

  @Patch(':id/absence-type')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async updateAbsenceType(
    @Param('id') id: string,
    @Body('absenceType') absenceType: AbsenceType,
    @Body('note') note?: string,
  ) {
    return this.attendanceService.updateAbsenceType(id, absenceType, note);
  }
}

