import { JwtPayload } from '../../common/types/auth.types';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';
import type { GlobalSearchResult } from './types/search-result.type';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(query: SearchQueryDto, user: JwtPayload): Promise<GlobalSearchResult[]>;
}
