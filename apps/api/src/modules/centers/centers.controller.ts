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
import { CentersService } from './centers.service';
import { CreateCenterDto, UpdateCenterDto, QueryCenterDto } from './dto';
import { Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@Controller('centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Get()
  async findAll(@Query() query: QueryCenterDto) {
    return this.centersService.findAll({
      skip: query.skip,
      take: query.take,
      search: query.search,
      isActive: query.isActive,
    });
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string) {
    return this.centersService.getStatistics(id);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.centersService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateCenterDto) {
    return this.centersService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCenterDto) {
    return this.centersService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id') id: string) {
    return this.centersService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.centersService.delete(id);
  }
}

