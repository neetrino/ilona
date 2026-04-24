export type GlobalSearchResultType =
  | 'student'
  | 'teacher'
  | 'group'
  | 'crm_lead'
  | 'lesson'
  | 'payment'
  | 'recording'
  | 'page';

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  badge?: string;
  metadata?: Record<string, string | number | boolean | null>;
};
