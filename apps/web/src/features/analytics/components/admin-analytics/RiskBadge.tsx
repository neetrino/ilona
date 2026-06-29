'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

export function RiskBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const t = useTranslations('analytics');
  const styles = {
    LOW: { bg: 'bg-green-100', text: 'text-green-700', label: t('lowRisk') },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('mediumRisk') },
    HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: t('highRisk') },
  };
  const style = styles[level];
  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        style.bg,
        style.text,
      )}
    >
      {style.label}
    </span>
  );
}
