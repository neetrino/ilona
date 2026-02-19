/**
 * API Error Handling
 * Provides error classes and utilities for API error handling
 */

export interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  statusCode: number;
  details?: string[];

  constructor(message: string, statusCode: number, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Extract error message from unknown error type
 * Handles ApiError, Error, and unknown types safely
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle axios-like error structure
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return typeof response.data.message === 'string' 
        ? response.data.message 
        : response.data.message[0] || fallback;
    }
  }
  
  // Handle error objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  
  return fallback;
}

