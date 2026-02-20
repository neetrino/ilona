import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCenterDto, UpdateCenterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CentersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalizes hex color from #RGB to #RRGGBB format
   */
  private normalizeHexColor(hex?: string): string | undefined {
    if (!hex || hex.trim() === '') return undefined;
    
    // Remove # if present
    const cleanHex = hex.replace('#', '').trim();
    
    // If empty after removing #, return undefined
    if (cleanHex.length === 0) return undefined;
    
    // If 3 characters, expand to 6
    if (cleanHex.length === 3) {
      return `#${cleanHex.split('').map(c => c + c).join('')}`.toUpperCase();
    }
    
    // If 6 characters, just normalize case
    if (cleanHex.length === 6) {
      return `#${cleanHex.toUpperCase()}`;
    }
    
    // Invalid format, return as-is (validation will catch it)
    return hex;
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
  }) {
    try {
      const { skip = 0, take = 50, search, isActive } = params || {};

      const where: Prisma.CenterWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [items, total] = await Promise.all([
        this.prisma.center.findMany({
          where,
          skip,
          take,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { groups: true },
            },
          },
        }),
        this.prisma.center.count({ where }),
      ]);

      return {
        items,
        total,
        page: Math.floor(skip / take) + 1,
        pageSize: take,
        totalPages: Math.ceil(total / take),
      };
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const center = await this.prisma.center.findUnique({
        where: { id },
        include: {
          groups: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              _count: {
                select: { students: true, lessons: true },
              },
            },
          },
          _count: {
            select: { groups: true },
          },
        },
      });

      if (!center) {
        throw new NotFoundException(`Center with ID ${id} not found`);
      }

      return center;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async create(dto: CreateCenterDto) {
    // Check for duplicate name (case-insensitive)
    const existingCenter = await this.prisma.center.findFirst({
      where: {
        name: {
          equals: dto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCenter) {
      throw new ConflictException(`A center with the name "${dto.name}" already exists`);
    }

    return this.prisma.center.create({
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        description: dto.description,
        colorHex: this.normalizeHexColor(dto.colorHex),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCenterDto) {
    await this.findById(id); // Check if exists

    // Check for duplicate name if name is being updated
    if (dto.name) {
      const existingCenter = await this.prisma.center.findFirst({
        where: {
          name: {
            equals: dto.name,
            mode: 'insensitive',
          },
          id: {
            not: id, // Exclude current center
          },
        },
      });

      if (existingCenter) {
        throw new ConflictException(`A center with the name "${dto.name}" already exists`);
      }
    }

    // Normalize colorHex if provided
    const updateData = { ...dto };
    if (dto.colorHex !== undefined) {
      updateData.colorHex = this.normalizeHexColor(dto.colorHex);
    }

    return this.prisma.center.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const center = await this.findById(id); // Check if exists

    // Check if center has groups
    const groupsCount = await this.prisma.group.count({
      where: { centerId: id },
    });

    if (groupsCount > 0) {
      throw new BadRequestException(
        `Cannot delete center "${center.name}" because it has ${groupsCount} group(s) associated with it. Please remove or reassign all groups first.`
      );
    }

    // Check if center has students (via groups)
    const studentsCount = await this.prisma.student.count({
      where: {
        group: {
          centerId: id,
        },
      },
    });

    if (studentsCount > 0) {
      throw new BadRequestException(
        `Cannot delete center "${center.name}" because it has ${studentsCount} student(s) associated with it through groups. Please remove or reassign all students first.`
      );
    }

    return this.prisma.center.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const center = await this.findById(id);

    return this.prisma.center.update({
      where: { id },
      data: { isActive: !center.isActive },
    });
  }

  async getStatistics(id: string) {
    await this.findById(id);

    const [groupsCount, studentsCount, lessonsCount] = await Promise.all([
      this.prisma.group.count({ where: { centerId: id } }),
      this.prisma.student.count({
        where: { group: { centerId: id } },
      }),
      this.prisma.lesson.count({
        where: { group: { centerId: id } },
      }),
    ]);

    return {
      groupsCount,
      studentsCount,
      lessonsCount,
    };
  }
}

