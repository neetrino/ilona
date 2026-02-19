/**
 * API URL Utilities
 * Provides utilities for converting and proxying file URLs
 */

import { getApiBaseUrl } from './api-config';

/**
 * Convert a relative API URL to a full URL
 * This is needed for logo URLs that are relative paths like "/api/settings/logo/image"
 */
export function getFullApiUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  
  // If it's already a full URL (starts with http:// or https://), return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // If it's a relative path starting with /api/, convert to full API URL
  // API_URL is already "http://localhost:4000/api", so we replace "/api" with the full API_URL
  if (relativePath.startsWith('/api/')) {
    const pathWithoutApi = relativePath.substring(4); // Remove "/api" prefix
    return `${getApiBaseUrl()}${pathWithoutApi}`;
  }
  
  // If it starts with /, it's a relative path - prepend API base URL
  if (relativePath.startsWith('/')) {
    return `${getApiBaseUrl()}${relativePath}`;
  }
  
  return relativePath;
}

/**
 * Convert a file URL to use the API proxy if it's an R2 URL
 * This avoids CORS issues when loading audio/video files from R2 storage
 */
export function getProxiedFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;

  // If it's a relative API path (like /api/settings/logo/image), convert to full URL
  if (fileUrl.startsWith('/api/')) {
    return getFullApiUrl(fileUrl);
  }

  // If it's already a local API URL, return as is
  if (fileUrl.includes('/api/storage/file/')) {
    return fileUrl;
  }

  // If it's a data URL, return as is
  if (fileUrl.startsWith('data:')) {
    return fileUrl;
  }

  // If it's an R2 URL (contains .r2.dev), proxy it through the API
  if (fileUrl.includes('.r2.dev')) {
    const apiBaseUrl = getApiBaseUrl();
    return `${apiBaseUrl}/storage/proxy?url=${encodeURIComponent(fileUrl)}`;
  }

  // If it's a localhost API URL but not using the proxy, check if it needs proxy
  // For files that might have CORS issues, use proxy
  try {
    const url = new URL(fileUrl);
    // If it's from a different origin and not our API, proxy it
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      if (url.origin !== currentOrigin && !url.origin.includes('localhost:4000')) {
        const apiBaseUrl = getApiBaseUrl();
        return `${apiBaseUrl}/storage/proxy?url=${encodeURIComponent(fileUrl)}`;
      }
    }
  } catch {
    // If URL parsing fails, return as is
  }

  // For all other URLs, return as is
  return fileUrl;
}

