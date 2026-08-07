/**
 * Regression checks for Daily Plan hits in global search UI wiring.
 * Run:
 *   pnpm dlx tsx --tsconfig apps/web/tsconfig.json apps/web/src/features/search/global-search-daily-plan.selftest.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GlobalSearchResult, GlobalSearchResultType } from './types/search.types';
import { DAILY_PLAN_VIEW_PARAM } from '../daily-plan/useDailyPlanViewSheet';

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '../../..');

{
  const types: GlobalSearchResultType[] = [
    'student',
    'teacher',
    'group',
    'crm_lead',
    'lesson',
    'payment',
    'recording',
    'daily_plan',
    'page',
  ];
  assert.equal(types.includes('daily_plan'), true);
  console.log('ok: daily_plan is a GlobalSearchResultType');
}

{
  assert.equal(DAILY_PLAN_VIEW_PARAM, 'planId');
  const planId = 'plan-fear';
  const href = `/admin/daily-plan?${DAILY_PLAN_VIEW_PARAM}=${encodeURIComponent(planId)}`;
  assert.equal(href, '/admin/daily-plan?planId=plan-fear');

  const teacherHref = `/teacher/daily-plan?${DAILY_PLAN_VIEW_PARAM}=${encodeURIComponent(planId)}`;
  assert.equal(teacherHref, '/teacher/daily-plan?planId=plan-fear');
  console.log('ok: daily plan search href opens view sheet via planId');
}

{
  const sample: GlobalSearchResult = {
    id: 'plan-fear',
    type: 'daily_plan',
    title: 'The fear of being ordinary',
    subtitle: 'Ilona Sahakyan · A1 Adults',
    description: '2026-05-22T00:00:00.000Z',
    href: '/admin/daily-plan?planId=plan-fear',
    badge: 'Daily Plan',
  };
  assert.equal(sample.type, 'daily_plan');
  assert.match(sample.href, /\bplanId=/);
  console.log('ok: sample daily_plan result shape');
}

{
  const barPath = path.join(here, 'components/GlobalSearchBar.tsx');
  const dropdownPath = path.join(here, 'components/GlobalSearchDropdown.tsx');
  const barSrc = readFileSync(barPath, 'utf8');
  const dropdownSrc = readFileSync(dropdownPath, 'utf8');

  assert.match(barSrc, /daily_plan:\s*'searchTypeDailyPlan'/);
  assert.match(dropdownSrc, /case\s+'daily_plan'/);
  assert.match(dropdownSrc, /FileText/);
  console.log('ok: GlobalSearchBar + Dropdown wire daily_plan badge/icon');
}

{
  const en = JSON.parse(readFileSync(path.join(webRoot, 'languages/en.json'), 'utf8')) as {
    common: Record<string, string>;
  };
  const hy = JSON.parse(readFileSync(path.join(webRoot, 'languages/hy.json'), 'utf8')) as {
    common: Record<string, string>;
  };
  assert.equal(en.common.searchTypeDailyPlan, 'Daily Plan');
  assert.equal(hy.common.searchTypeDailyPlan, 'Օրական պլան');
  console.log('ok: en/hy searchTypeDailyPlan labels');
}

console.log('\nAll global-search daily-plan UI regressions passed.');
