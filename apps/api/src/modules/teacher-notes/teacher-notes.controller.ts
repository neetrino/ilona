import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { CurrentUser, Roles } from '../../common/decorators';
import { JwtPayload } from '../../common/types/auth.types';
import { CreateTeacherNoteDto } from './dto/create-teacher-note.dto';
import { TeacherNotesService } from './teacher-notes.service';

@Controller('teacher-notes')
export class TeacherNotesController {
  constructor(private readonly service: TeacherNotesService) {}

  @Get('me')
  @Roles(UserRole.TEACHER)
  async list(@CurrentUser() user: JwtPayload) {
    return this.service.listForUser(user.sub);
  }

  @Post('me')
  @Roles(UserRole.TEACHER)
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTeacherNoteDto) {
    return this.service.createForUser(user.sub, dto);
  }

  @Delete('me/:id')
  @Roles(UserRole.TEACHER)
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.removeForUser(user.sub, id);
  }
}
