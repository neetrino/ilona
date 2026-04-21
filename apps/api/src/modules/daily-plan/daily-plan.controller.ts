import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DailyPlanService } from './daily-plan.service';
import {
  CreateDailyPlanDto,
  UpdateDailyPlanDto,
  QueryDailyPlanDto,
} from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';

@Controller('daily-plans')
export class DailyPlanController {
  constructor(private readonly service: DailyPlanService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async findAll(
    @Query() query: QueryDailyPlanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findAll(query, user.sub, user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findById(id, user.sub, user.role);
  }

  @Post()
  @Roles(UserRole.TEACHER)
  async create(
    @Body() dto: CreateDailyPlanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDailyPlanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user.sub, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER)
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.sub, user.role);
  }
}
