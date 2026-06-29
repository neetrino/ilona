import { Injectable } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { matchQuickPages } from './search-quick-pages';
import { normalizeSearchQuery, searchTokensFromNormalized } from './search-query.util';
import type { GlobalSearchResult } from './types/search-result.type';
import { DEFAULT_MAX, PER_TYPE } from './search-filter.util';
import { SearchStaffService } from './search-staff.service';
import { SearchRoleQueryService } from './search-role-query.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly staffService: SearchStaffService,
    private readonly roleQueryService: SearchRoleQueryService,
  ) {}

  async globalSearch(user: JwtPayload, rawQuery: string, limit?: number): Promise<GlobalSearchResult[]> {
    const q = normalizeSearchQuery(rawQuery);
    if (q.length < 2) {
      return [];
    }
    const tokens = searchTokensFromNormalized(q);
    if (tokens.length === 0) {
      return [];
    }

    const maxTotal = Math.min(Math.max(1, limit ?? DEFAULT_MAX), 30);
    const perType = Math.min(PER_TYPE, Math.max(5, Math.ceil(maxTotal / 3)));
    const quickCap = Math.min(8, maxTotal);

    const quick = matchQuickPages(user.role, q, quickCap);

    let entityResults: GlobalSearchResult[] = [];

    if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
      const centerId = getManagerCenterIdOrThrow(user);
      const [students, teachers, groups, leads, lessons, payments, recordings] = await Promise.all([
        this.staffService.searchStudentsStaff(tokens, perType, centerId),
        this.staffService.searchTeachersStaff(tokens, perType, centerId),
        this.staffService.searchGroupsStaff(tokens, perType, centerId),
        this.staffService.searchCrmLeadsStaff(tokens, perType, centerId),
        this.staffService.searchLessonsStaff(tokens, perType, centerId),
        this.staffService.searchPaymentsStaff(tokens, q, perType, centerId),
        this.staffService.searchRecordingsStaff(tokens, q, perType, centerId),
      ]);
      entityResults = [...students, ...teachers, ...groups, ...leads, ...lessons, ...payments, ...recordings];
    } else if (user.role === UserRole.TEACHER) {
      entityResults = await this.roleQueryService.searchTeacherEntities(user.sub, tokens, perType);
    } else if (user.role === UserRole.STUDENT) {
      entityResults = await this.roleQueryService.searchStudentEntities(user.sub, tokens, q, perType);
    }

    const merged = [...quick, ...entityResults];
    const seen = new Set<string>();
    const deduped: GlobalSearchResult[] = [];
    for (const item of merged) {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= maxTotal) break;
    }
    return deduped;
  }
}
