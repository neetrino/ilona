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
import { Public, Roles } from '../../common/decorators';
import { UserRole } from '@ilona/database';

@Controller('centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  /** Public: used by Home page "Our Branches" without login */
  @Public()
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

  /** Detailed view payload for the admin center popup (Teachers/Students/Groups/Schedule tabs). */
  @Get(':id/details')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getDetails(@Param('id') id: string) {
    return this.centersService.getDetails(id);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<unknown> {
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

