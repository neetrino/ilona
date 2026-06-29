import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchStaffService } from './search-staff.service';
import { SearchRoleQueryService } from './search-role-query.service';

@Module({
  controllers: [SearchController],
  providers: [SearchService, SearchStaffService, SearchRoleQueryService],
})
export class SearchModule {}
