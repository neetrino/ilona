import { api } from '@/shared/lib/api';
import type { UserProfile, UpdateProfileDto, ChangePasswordDto } from '../types';

/**
 * Get current user profile
 */
export async function fetchProfile(): Promise<UserProfile> {
  return api.get<UserProfile>('/users/me');
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
  return api.patch<UserProfile>('/users/me', data);
}

/**
 * Change password
 */
export async function changePassword(data: ChangePasswordDto): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>('/auth/change-password', data);
}

/**
 * Upload avatar
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post<{ success: boolean; data: { url: string; key: string; fileName: string; fileSize: number; mimeType: string } }>('/storage/avatar', formData);
    
    // Update user profile with the avatar URL
    if (response.success && response.data?.url) {
      await api.patch<UserProfile>('/users/me', { avatarUrl: response.data.url });
      return { avatarUrl: response.data.url };
    }
    
    throw new Error('Failed to upload avatar: Invalid response from server');
  } catch (error: any) {
    // Extract user-friendly error message from API response
    if (error?.statusCode === 413) {
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    }
    if (error?.statusCode === 415) {
      throw new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed.');
    }
    if (error?.statusCode === 400) {
      throw new Error(error?.message || 'Invalid file. Please check the file and try again.');
    }
    if (error?.statusCode === 500) {
      throw new Error(error?.message || 'Server error. Please try again later or contact support.');
    }
    throw error;
  }
}

/**
 * Delete avatar
 */
export async function deleteAvatar(): Promise<{ success: boolean }> {
  // Update user profile to remove avatar URL
  await api.patch<UserProfile>('/users/me', { avatarUrl: null });
  return { success: true };
}
