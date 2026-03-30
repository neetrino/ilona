import { Controller, Get, Param, Patch, Body, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateManagerDto } from './dto/create-manager.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto): Promise<unknown> {
    return this.usersService.update(user.sub, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async findAll(): Promise<unknown> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async findOne(@Param('id') id: string): Promise<unknown> {
    return this.usersService.findById(id);
  }

  @Get('managers/list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get managers list (Admin only)' })
  async findManagers(): Promise<unknown> {
    return this.usersService.findManagers();
  }

  @Post('managers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create manager (Admin only)' })
  async createManager(@Body() dto: CreateManagerDto): Promise<unknown> {
    return this.usersService.createManager(dto);
  }
}
