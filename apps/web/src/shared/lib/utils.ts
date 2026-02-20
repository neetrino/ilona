import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a locale string
 */
export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'hy' ? 'hy-AM' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date to a time string
 */
export function formatTime(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale === 'hy' ? 'hy-AM' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format currency (AMD only)
 */
export function formatCurrency(amount: number, _currency: string = 'AMD'): string {
  // Always use AMD, ignore currency parameter
  return new Intl.NumberFormat('hy-AM', {
    style: 'currency',
    currency: 'AMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get user initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Delay execution (for testing/debugging)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  
  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  
  return null;
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Derive a lighter shade of a hex color
 * @param hex - Hex color (e.g., #253046)
 * @param opacity - Opacity/lightness factor (0-1, default 0.12 for ~12% opacity on white)
 * @returns Lighter hex color
 */
export function lightenColor(hex: string | null | undefined, opacity: number = 0.12): string {
  // Default color if none provided
  if (!hex) {
    return '#F3F4F6'; // Default light gray
  }
  
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return '#F3F4F6'; // Fallback to default
  }
  
  // Blend with white (255, 255, 255) using the opacity factor
  // Formula: result = original * (1 - opacity) + white * opacity
  const r = Math.round(rgb.r * (1 - opacity) + 255 * opacity);
  const g = Math.round(rgb.g * (1 - opacity) + 255 * opacity);
  const b = Math.round(rgb.b * (1 - opacity) + 255 * opacity);
  
  return rgbToHex(r, g, b);
}

/**
 * Get contrast color (white or black) for text on a colored background
 * Uses relative luminance formula
 */
export function getContrastColor(hex: string | null | undefined): 'white' | 'black' {
  if (!hex) {
    return 'black'; // Default to black on light backgrounds
  }
  
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 'black';
  }
  
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Use white text on dark backgrounds, black on light
  return luminance < 0.5 ? 'white' : 'black';
}


