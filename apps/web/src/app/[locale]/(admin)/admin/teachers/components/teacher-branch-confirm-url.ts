import type { SearchParamUpdates } from '@/shared/lib/url-search-params';
import type {
  TeacherBranchConfirmState,
  TeacherBranchConfirmVariant,
} from './TeacherBranchAssignConfirmDialog';

export const BRANCH_CONFIRM_TEACHER_PARAM = 'branchConfirmTeacherId';
export const BRANCH_CONFIRM_ACTION_PARAM = 'branchConfirmAction';
export const BRANCH_CONFIRM_BRANCH_PARAM = 'branchConfirmBranchId';
export const BRANCH_CONFIRM_BRANCHES_PARAM = 'branchConfirmBranchIds';

const BRANCH_CONFIRM_URL_KEYS = [
  BRANCH_CONFIRM_TEACHER_PARAM,
  BRANCH_CONFIRM_ACTION_PARAM,
  BRANCH_CONFIRM_BRANCH_PARAM,
  BRANCH_CONFIRM_BRANCHES_PARAM,
] as const;

interface BranchOption {
  id: string;
  label: string;
}

function isConfirmVariant(value: string | null): value is TeacherBranchConfirmVariant {
  return value === 'add' || value === 'remove' || value === 'selectAll' || value === 'clear';
}

export function branchConfirmClearUrlUpdates(): SearchParamUpdates {
  return Object.fromEntries(BRANCH_CONFIRM_URL_KEYS.map((key) => [key, null]));
}

export function branchConfirmToUrlUpdates(
  state: TeacherBranchConfirmState,
  teacherId: string,
): SearchParamUpdates {
  return {
    [BRANCH_CONFIRM_TEACHER_PARAM]: teacherId,
    [BRANCH_CONFIRM_ACTION_PARAM]: state.variant,
    [BRANCH_CONFIRM_BRANCH_PARAM]: state.branchId ?? null,
    [BRANCH_CONFIRM_BRANCHES_PARAM]:
      state.selectAllIds && state.selectAllIds.length > 0
        ? state.selectAllIds.join(',')
        : null,
  };
}

export function parseBranchConfirmFromUrl(args: {
  teacherId: string;
  urlTeacherId: string | null;
  action: string | null;
  branchId: string | null;
  branchIdsCsv: string | null;
  teacherName: string;
  options: BranchOption[];
}): TeacherBranchConfirmState | null {
  const { teacherId, urlTeacherId, action, branchId, branchIdsCsv, teacherName, options } = args;

  if (urlTeacherId !== teacherId || !isConfirmVariant(action)) {
    return null;
  }

  const optionById = new Map(options.map((option) => [option.id, option]));

  if (action === 'add' || action === 'remove') {
    if (!branchId) {
      return null;
    }
    const branch = optionById.get(branchId);
    if (!branch) {
      return null;
    }
    return {
      variant: action,
      teacherName,
      branchId,
      branchName: branch.label,
    };
  }

  if (action === 'selectAll') {
    const selectAllIds = (branchIdsCsv ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (selectAllIds.length === 0) {
      return null;
    }
    const branchNames = selectAllIds
      .map((id) => optionById.get(id)?.label)
      .filter((name): name is string => Boolean(name));
    if (branchNames.length === 0) {
      return null;
    }
    return {
      variant: 'selectAll',
      teacherName,
      branchNames,
      selectAllIds,
    };
  }

  if (action === 'clear') {
    return {
      variant: 'clear',
      teacherName,
    };
  }

  return null;
}
