'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import type { TeacherBranchConfirmState } from './TeacherBranchAssignConfirmDialog';
import {
  BRANCH_CONFIRM_ACTION_PARAM,
  BRANCH_CONFIRM_BRANCHES_PARAM,
  BRANCH_CONFIRM_BRANCH_PARAM,
  BRANCH_CONFIRM_TEACHER_PARAM,
  branchConfirmClearUrlUpdates,
  branchConfirmToUrlUpdates,
  parseBranchConfirmFromUrl,
} from './teacher-branch-confirm-url';

interface BranchOption {
  id: string;
  label: string;
}

interface UseTeacherBranchConfirmArgs {
  teacherId: string;
  teacherName: string;
  options: BranchOption[];
  draftIds: Set<string>;
  setDraftIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onConfirmOpen?: () => void;
}

export function useTeacherBranchConfirm({
  teacherId,
  teacherName,
  options,
  draftIds,
  setDraftIds,
  onConfirmOpen,
}: UseTeacherBranchConfirmArgs) {
  const { searchParams, urlRevision, replaceParams, readParam } = useAppSearchUrl();
  const [confirmState, setConfirmState] = useState<TeacherBranchConfirmState | null>(null);

  const clearConfirmUrl = useCallback(() => {
    replaceParams(branchConfirmClearUrlUpdates());
  }, [replaceParams]);

  const openConfirmState = useCallback(
    (state: TeacherBranchConfirmState) => {
      setConfirmState(state);
      replaceParams(branchConfirmToUrlUpdates(state, teacherId));
      onConfirmOpen?.();
    },
    [onConfirmOpen, replaceParams, teacherId],
  );

  const dismissConfirm = useCallback(() => {
    setConfirmState(null);
    clearConfirmUrl();
  }, [clearConfirmUrl]);

  useEffect(() => {
    const urlTeacherId = readParam(BRANCH_CONFIRM_TEACHER_PARAM);
    if (urlTeacherId !== teacherId) {
      setConfirmState(null);
      return;
    }

    const restored = parseBranchConfirmFromUrl({
      teacherId,
      urlTeacherId,
      action: readParam(BRANCH_CONFIRM_ACTION_PARAM),
      branchId: readParam(BRANCH_CONFIRM_BRANCH_PARAM),
      branchIdsCsv: readParam(BRANCH_CONFIRM_BRANCHES_PARAM),
      teacherName,
      options,
    });

    if (restored) {
      setConfirmState(restored);
      onConfirmOpen?.();
    }
  }, [
    teacherId,
    teacherName,
    options,
    searchParams,
    urlRevision,
    readParam,
    onConfirmOpen,
  ]);

  const requestToggleBranch = useCallback(
    (option: BranchOption) => {
      const isSelected = draftIds.has(option.id);
      openConfirmState({
        variant: isSelected ? 'remove' : 'add',
        teacherName,
        branchId: option.id,
        branchName: option.label,
      });
    },
    [draftIds, openConfirmState, teacherName],
  );

  const requestSelectAllVisible = useCallback(
    (filteredOptions: BranchOption[]) => {
      const branchesToAdd = filteredOptions.filter((option) => !draftIds.has(option.id));
      if (branchesToAdd.length === 0) {
        return;
      }

      openConfirmState({
        variant: 'selectAll',
        teacherName,
        branchNames: branchesToAdd.map((option) => option.label),
        selectAllIds: branchesToAdd.map((option) => option.id),
      });
    },
    [draftIds, openConfirmState, teacherName],
  );

  const requestClearSelection = useCallback(() => {
    if (draftIds.size === 0) {
      return;
    }

    openConfirmState({
      variant: 'clear',
      teacherName,
    });
  }, [draftIds.size, openConfirmState, teacherName]);

  const handleConfirm = useCallback(() => {
    if (!confirmState) {
      return;
    }

    switch (confirmState.variant) {
      case 'add':
        if (confirmState.branchId) {
          setDraftIds((prev) => new Set([...prev, confirmState.branchId!]));
        }
        break;
      case 'remove':
        if (confirmState.branchId) {
          setDraftIds((prev) => {
            const next = new Set(prev);
            next.delete(confirmState.branchId!);
            return next;
          });
        }
        break;
      case 'selectAll':
        setDraftIds((prev) => {
          const next = new Set(prev);
          confirmState.selectAllIds?.forEach((id) => next.add(id));
          return next;
        });
        break;
      case 'clear':
        setDraftIds(new Set());
        break;
      default:
        break;
    }

    dismissConfirm();
  }, [confirmState, dismissConfirm, setDraftIds]);

  return {
    confirmState,
    dismissConfirm,
    requestToggleBranch,
    requestSelectAllVisible,
    requestClearSelection,
    handleConfirm,
  };
}
