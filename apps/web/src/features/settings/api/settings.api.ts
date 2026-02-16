import { api, ApiError } from '@/shared/lib/api';
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
  } catch (error: unknown) {
    // Extract user-friendly error message from API response
    if (error instanceof ApiError) {
      if (error.statusCode === 413) {
        throw new Error('File size too large. Please upload an image smaller than 5MB.');
      }
      if (error.statusCode === 415) {
        throw new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed.');
      }
      if (error.statusCode === 400) {
        throw new Error(error.message || 'Invalid file. Please check the file and try again.');
      }
      if (error.statusCode === 500) {
        throw new Error(error.message || 'Server error. Please try again later or contact support.');
      }
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

/**
 * Get current logo URL (public - all roles)
 */
export async function fetchLogo(): Promise<{ logoUrl: string | null }> {
  return api.get<{ logoUrl: string | null }>('/settings/logo');
}

/**
 * Upload logo (Admin only)
 */
export async function uploadLogo(file: File): Promise<{ logoUrl: string; key: string; mimeType: string; fileSize: number }> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post<{ success: boolean; data: { logoUrl: string; key: string; mimeType: string; fileSize: number } }>('/settings/logo', formData);
    
    if (response.success && response.data?.logoUrl) {
      return {
        logoUrl: response.data.logoUrl,
        key: response.data.key,
        mimeType: response.data.mimeType,
        fileSize: response.data.fileSize,
      };
    }
    
    throw new Error('Failed to upload logo: Invalid response from server');
  } catch (error: unknown) {
    // Extract user-friendly error message from API response
    if (error instanceof ApiError) {
      if (error.statusCode === 413) {
        throw new Error('File size too large. Please upload an image smaller than 5MB.');
      }
      if (error.statusCode === 415) {
        throw new Error('Invalid file type. Only PNG, JPG, WEBP, and SVG images are allowed.');
      }
      if (error.statusCode === 400) {
        throw new Error(error.message || 'Invalid file. Please check the file and try again.');
      }
      if (error.statusCode === 500) {
        throw new Error(error.message || 'Server error. Please try again later or contact support.');
      }
      if (error.statusCode === 403) {
        throw new Error('You do not have permission to upload logos. Admin access required.');
      }
    }
    throw error;
  }
}

/**
 * Delete logo (Admin only)
 */
export async function deleteLogo(): Promise<{ success: boolean }> {
  return api.post<{ success: boolean; message: string }>('/settings/logo/delete');
}