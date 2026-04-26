'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Backpack,
  BadgeCheck,
  Book,
  BookMarked,
  BookOpen,
  Brain,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Globe,
  GraduationCap,
  Handshake,
  Headphones,
  Landmark,
  Languages,
  Library,
  Lightbulb,
  ListOrdered,
  Medal,
  MessageCircle,
  MessageSquare,
  Mic,
  NotebookPen,
  PenLine,
  Pencil,
  Presentation,
  Quote,
  School,
  ScrollText,
  Sparkles,
  SpellCheck2,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Type,
  Users,
  UsersRound,
  Volume2,
} from 'lucide-react';
import { isGroupIconKey, type GroupIconKey } from '@ilona/types';
import { cn } from '@/shared/lib/utils';

const GROUP_ICON_MAP: Record<GroupIconKey, LucideIcon> = {
  languages: Languages,
  globe: Globe,
  book: Book,
  'book-open': BookOpen,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  mic: Mic,
  headphones: Headphones,
  'volume-2': Volume2,
  'scroll-text': ScrollText,
  'file-text': FileText,
  type: Type,
  'list-ordered': ListOrdered,
  'spell-check-2': SpellCheck2,
  quote: Quote,
  'pen-line': PenLine,
  pencil: Pencil,
  'notebook-pen': NotebookPen,
  'book-marked': BookMarked,
  'users-round': UsersRound,
  users: Users,
  handshake: Handshake,
  school: School,
  library: Library,
  landmark: Landmark,
  'building-2': Building2,
  backpack: Backpack,
  presentation: Presentation,
  'graduation-cap': GraduationCap,
  star: Star,
  trophy: Trophy,
  medal: Medal,
  award: Award,
  'badge-check': BadgeCheck,
  'trending-up': TrendingUp,
  target: Target,
  sparkles: Sparkles,
  brain: Brain,
  lightbulb: Lightbulb,
  'calendar-days': CalendarDays,
  'clipboard-list': ClipboardList,
};

export function getGroupIconComponent(iconKey: string | null | undefined): LucideIcon | null {
  if (!iconKey || !isGroupIconKey(iconKey)) return null;
  return GROUP_ICON_MAP[iconKey];
}

interface GroupIconDisplayProps {
  iconKey?: string | null;
  /** Pixel size for the square icon box (default 20). */
  size?: number;
  className?: string;
  /** When true and `iconKey` is missing/invalid, render nothing instead of fallback. */
  hideWhenEmpty?: boolean;
}

/**
 * Renders the configured group icon, or a neutral fallback when missing (unless `hideWhenEmpty`).
 */
export function GroupIconDisplay({
  iconKey,
  size = 20,
  className,
  hideWhenEmpty = false,
}: GroupIconDisplayProps) {
  const Cmp = getGroupIconComponent(iconKey);
  if (!Cmp) {
    if (hideWhenEmpty) return null;
    return (
      <School
        className={cn('shrink-0 text-slate-400', className)}
        size={size}
        strokeWidth={1.75}
        aria-hidden
      />
    );
  }
  return (
    <Cmp
      className={cn('shrink-0 text-slate-600', className)}
      size={size}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}
