import type { ConvertibleToNumber } from './settings.types';
export declare const DASHBOARD_BANNER_TITLE_MAX = 150;
export declare const DASHBOARD_BANNER_SUBTITLE_MAX = 400;
export declare function extractKeyFromUrl(value: string | null): string | null;
export declare function normalizeDashboardBannerText(value: string | null | undefined, maxLength: number): string | null;
export declare function convertToNumber(value: ConvertibleToNumber, fallbackValue?: number): number;
