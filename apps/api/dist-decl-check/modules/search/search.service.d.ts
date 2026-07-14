import { JwtPayload } from '../../common/types/auth.types';
import type { GlobalSearchResult } from './types/search-result.type';
import { SearchStaffService } from './search-staff.service';
import { SearchRoleQueryService } from './search-role-query.service';
export declare class SearchService {
    private readonly staffService;
    private readonly roleQueryService;
    constructor(staffService: SearchStaffService, roleQueryService: SearchRoleQueryService);
    globalSearch(user: JwtPayload, rawQuery: string, limit?: number): Promise<GlobalSearchResult[]>;
}
