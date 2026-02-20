'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  fetchLogo,
  uploadLogo,
  deleteLogo,
  fetchActionPercents,
  updateActionPercents,
  fetchPenalties,
  updatePenalties,
} from '../api/settings.api';
import type { UpdateProfileDto, ChangePasswordDto } from '../types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { teacherKeys } from '@/features/teachers';
import { financeKeys } from '@/features/finance/hooks/useFinance';

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  profile: () => [...settingsKeys.all, 'profile'] as const,
  logo: () => [...settingsKeys.all, 'logo'] as const,
  public: () => [...settingsKeys.all, 'public'] as const,
  actionPercents: () => [...settingsKeys.all, 'action-percents'] as const,
  penalties: () => [...settingsKeys.all, 'penalties'] as const,
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

/**
 * Hook to fetch logo (public - all roles)
 */
export function useLogo() {
  return useQuery({
    queryKey: settingsKeys.logo(),
    queryFn: () => fetchLogo(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to upload logo (Admin only)
 */
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: (result) => {
      // Immediately update the query data with the new logo URL for instant UI update
      // This prevents the UI from reverting to the old logo while the query refetches
      queryClient.setQueryData(settingsKeys.logo(), {
        logoUrl: result.logoUrl,
      });
      
      // Also invalidate to ensure all components get the fresh data
      queryClient.invalidateQueries({ queryKey: settingsKeys.logo() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.public() });
    },
  });
}

/**
 * Hook to delete logo (Admin only)
 */
export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteLogo(),
    onSuccess: () => {
      // Immediately update the query data to remove the logo for instant UI update
      queryClient.setQueryData(settingsKeys.logo(), {
        logoUrl: null,
      });
      
      // Also invalidate to ensure all components get the fresh data
      queryClient.invalidateQueries({ queryKey: settingsKeys.logo() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.public() });
    },
  });
}

/**
 * Hook to fetch action percent settings (Admin only)
 */
export function useActionPercents() {
  return useQuery({
    queryKey: settingsKeys.actionPercents(),
    queryFn: () => fetchActionPercents(),
  });
}

/**
 * Hook to update action percent settings (Admin only) - DEPRECATED
 */
export function useUpdateActionPercents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      absencePercent: number;
      feedbacksPercent: number;
      voicePercent: number;
      textPercent: number;
    }) => updateActionPercents(data),
    onSuccess: () => {
      // Invalidate action percents query
      queryClient.invalidateQueries({ queryKey: settingsKeys.actionPercents() });
      
      // Invalidate all salary-related queries so finance recalculates immediately
      queryClient.invalidateQueries({ queryKey: ['finance', 'salaries'] });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
    },
  });
}

/**
 * Hook to fetch penalty amounts (Admin only)
 */
export function usePenalties() {
  return useQuery({
    queryKey: settingsKeys.penalties(),
    queryFn: () => fetchPenalties(),
  });
}

/**
 * Hook to update penalty amounts (Admin only)
 */
export function useUpdatePenalties() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      penaltyAbsenceAmd: number;
      penaltyFeedbackAmd: number;
      penaltyVoiceAmd: number;
      penaltyTextAmd: number;
    }) => updatePenalties(data),
    onSuccess: () => {
      // Invalidate penalties query
      queryClient.invalidateQueries({ queryKey: settingsKeys.penalties() });
      
      // Invalidate all salary-related queries so finance recalculates immediately
      queryClient.invalidateQueries({ queryKey: ['finance', 'salaries'] });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
    },
  });
}
