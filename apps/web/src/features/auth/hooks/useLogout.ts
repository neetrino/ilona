'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { chatKeys } from '@/features/chat/hooks/useChat';
import { studentKeys } from '@/features/students/hooks/useStudents';
import { groupKeys } from '@/features/groups/hooks/useGroups';
import { lessonKeys } from '@/features/lessons/hooks/useLessons';
import { teacherKeys } from '@/features/teachers/hooks/useTeachers';

/**
 * Returns a logout function that clears chat and teacher-scoped caches, then logs out.
 * Use this instead of useAuthStore().logout so the next user does not see
 * the previous user's cached data (e.g. Teacher Y seeing Teacher X's students).
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useCallback(() => {
    // Clear role-scoped data so next login never sees previous user's state.
    queryClient.removeQueries({ queryKey: chatKeys.all });
    queryClient.removeQueries({ queryKey: [ ...studentKeys.all, 'my-dashboard' ] });
    queryClient.removeQueries({ queryKey: [ ...studentKeys.all, 'my-profile' ] });
    queryClient.removeQueries({ queryKey: [ ...studentKeys.all, 'my-teachers' ] });
    queryClient.removeQueries({ queryKey: [...studentKeys.all, 'my-assigned'] });
    queryClient.removeQueries({ queryKey: [...groupKeys.all, 'my-groups'] });
    queryClient.removeQueries({ queryKey: lessonKeys.all });
    queryClient.removeQueries({ queryKey: teacherKeys.all });
    logout();
  }, [logout, queryClient]);
}
