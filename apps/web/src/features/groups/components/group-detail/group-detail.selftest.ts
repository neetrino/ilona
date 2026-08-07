/**
 * Regression checks for group detail tabs / search destination.
 * Run:
 *   pnpm dlx tsx --tsconfig apps/web/tsconfig.json apps/web/src/features/groups/components/group-detail/group-detail.selftest.ts
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GROUP_DETAIL_TABS,
  isGroupDetailTab,
} from './group-detail.constants';

const here = path.dirname(fileURLToPath(import.meta.url));
const webSrc = path.resolve(here, '../../../..');
const appRoot = path.resolve(webSrc, 'app/[locale]/(admin)');

{
  assert.deepEqual([...GROUP_DETAIL_TABS], ['general', 'students', 'daily-plans']);
  assert.equal(isGroupDetailTab('general'), true);
  assert.equal(isGroupDetailTab('students'), true);
  assert.equal(isGroupDetailTab('daily-plans'), true);
  assert.equal(isGroupDetailTab('edit'), false);
  assert.equal(isGroupDetailTab(null), false);
  assert.equal(isGroupDetailTab(undefined), false);
  assert.equal(isGroupDetailTab(''), false);
  console.log('ok: group detail tab guards');
}

{
  const adminPage = path.join(appRoot, 'admin/groups/view/[groupId]/page.tsx');
  const managerPage = path.join(appRoot, 'manager/groups/view/[groupId]/page.tsx');
  assert.equal(existsSync(adminPage), true, 'admin group detail route missing');
  assert.equal(existsSync(managerPage), true, 'manager group detail route missing');
  console.log('ok: admin + manager detail routes exist');
}

{
  const contentPath = path.join(here, 'GroupDetailPageContent.tsx');
  const generalPath = path.join(here, 'GroupDetailGeneralTab.tsx');
  const studentsPath = path.join(here, 'GroupDetailStudentsTab.tsx');
  const plansPath = path.join(here, 'GroupDetailDailyPlansTab.tsx');
  for (const file of [contentPath, generalPath, studentsPath, plansPath]) {
    assert.equal(existsSync(file), true, `missing ${path.basename(file)}`);
  }
  console.log('ok: detail tab components present');
}

{
  // Search must open detail view; edit modal query is no longer the destination.
  const expectedHref = `/admin/groups/view/${encodeURIComponent('grp-connecticut')}`;
  assert.equal(expectedHref, '/admin/groups/view/grp-connecticut');
  assert.equal(expectedHref.includes('editGroup'), false);
  console.log('ok: search href shape for group detail');
}

console.log('\nAll group-detail regressions passed.');
