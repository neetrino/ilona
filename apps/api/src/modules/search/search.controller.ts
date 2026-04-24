import { Controller, Get, Query } from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';
import type { GlobalSearchResult } from './types/search-result.type';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER, UserRole.STUDENT)
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<GlobalSearchResult[]> {
    return this.searchService.globalSearch(user, query.query ?? '', query.limit);
  }
}
