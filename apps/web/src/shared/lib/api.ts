/**
 * API Library - Main Entry Point
 * Re-exports all API-related functionality for backward compatibility
 * 
 * This file has been refactored into separate modules:
 * - api-config.ts: API URL configuration
 * - api-errors.ts: Error handling classes and utilities
 * - api-client.ts: HTTP client with authentication
 * - api-url-utils.ts: URL utility functions
 */

// Re-export API configuration
export { getApiBaseUrl } from './api-config';

// Re-export error handling
export { ApiError, getErrorMessage, type ApiErrorResponse } from './api-errors';

// Re-export URL utilities
export { getFullApiUrl, getProxiedFileUrl } from './api-url-utils';

// Re-export API client instance
import { ApiClient } from './api-client';
import { API_URL } from './api-config';

export const api = new ApiClient(API_URL);