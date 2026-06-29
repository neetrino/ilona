'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  fetchAdminStudents,
  fetchAdminTeachers,
  fetchAdminGroups,
  fetchAdminAllUsers,
} from '../../api/chat.api';
import { chatKeys } from './chat-query-keys';

export function useAdminStudents(search?: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: chatKeys.adminStudents(search),
    queryFn: () => fetchAdminStudents(search),
    staleTime: 60 * 1000,
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  });
}

export function useAdminTeachers(search?: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: chatKeys.adminTeachers(search),
    queryFn: () => fetchAdminTeachers(search),
    staleTime: 60 * 1000,
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  });
}

export function useAdminGroups(search?: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: chatKeys.adminGroups(search),
    queryFn: () => fetchAdminGroups(search),
    staleTime: 60 * 1000,
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  });
}

export function useAdminAllUsers(search?: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: chatKeys.adminUsers(search),
    queryFn: () => fetchAdminAllUsers(search),
    staleTime: 60 * 1000,
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  });
}
