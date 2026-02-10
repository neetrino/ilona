'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
} from '../api/settings.api';
import type { UpdateProfileDto, ChangePasswordDto } from '../types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { teacherKeys } from '@/features/teachers';

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  profile: () => [...settingsKeys.all, 'profile'] as const,
};

/**
 * Hook to fetch user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn: () => fetchProfile(),
  });
}

/**
 * Hook to update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileDto) => updateProfile(data),
    onSuccess: (updatedProfile) => {
      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
      
      // If user is a teacher, also invalidate teacher queries
      if (user?.role === 'TEACHER' && user.id) {
        // Find teacher by userId - we need to invalidate all teacher queries
        // since we don't know the teacher ID from the user ID directly
        queryClient.invalidateQueries({ queryKey: teacherKeys.all });
      }
      
      // Update auth store with new user data
      if (updatedProfile && user) {
        setUser({
          ...user,
          firstName: updatedProfile.firstName || user.firstName,
          lastName: updatedProfile.lastName || user.lastName,
          phone: updatedProfile.phone || user.phone,
        });
      }
    },
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) => changePassword(data),
  });
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
      
      // Update auth store with new avatar URL
      if (result.avatarUrl && user) {
        setUser({
          ...user,
          avatarUrl: result.avatarUrl,
        });
      }
    },
  });
}

/**
 * Hook to delete avatar
 */
export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
      
      // Update auth store to remove avatar URL
      if (user) {
        setUser({
          ...user,
          avatarUrl: undefined,
        });
      }
    },
  });
}
