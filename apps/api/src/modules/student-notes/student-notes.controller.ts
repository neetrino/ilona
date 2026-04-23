import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { CurrentUser, Roles } from '../../common/decorators';
import { JwtPayload } from '../../common/types/auth.types';
import { CreateStudentNoteDto } from './dto/create-student-note.dto';
import { StudentNotesService } from './student-notes.service';

@Controller('student-notes')
export class StudentNotesController {
  constructor(private readonly service: StudentNotesService) {}

  @Get('me')
  @Roles(UserRole.STUDENT)
  async list(@CurrentUser() user: JwtPayload) {
    return this.service.listForUser(user.sub);
  }

  @Post('me')
  @Roles(UserRole.STUDENT)
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStudentNoteDto) {
    return this.service.createForUser(user.sub, dto);
  }

  @Delete('me/:id')
  @Roles(UserRole.STUDENT)
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.removeForUser(user.sub, id);
  }
}
