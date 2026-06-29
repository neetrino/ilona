import { StatCard } from '@/shared/components/ui';
import { useTranslations } from 'next-intl';

type LessonStats = {
  total?: number;
  completed?: number;
  completionRate?: number;
  scheduled?: number;
  inProgress?: number;
  cancelled?: number;
  missed?: number;
};

interface PortalCalendarStatsGridProps {
  stats: LessonStats | undefined;
}

export function PortalCalendarStatsGrid({ stats }: PortalCalendarStatsGridProps) {
  const t = useTranslations('calendar');

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
      <StatCard title={t('statsTotalLessons')} value={stats?.total || 0} />
      <StatCard
        title={t('statsCompleted')}
        value={stats?.completed || 0}
        change={{ value: t('statsCompletionRate', { value: stats?.completionRate || 0 }), type: 'positive' }}
      />
      <StatCard
        title={t('statsScheduled')}
        value={stats?.scheduled || 0}
        change={{ value: t('statsUpcoming'), type: 'neutral' }}
      />
      <StatCard
        title={t('statsInProgress')}
        value={stats?.inProgress || 0}
        change={{ value: t('statsLiveNow'), type: 'warning' }}
      />
      <StatCard
        title={t('statsCancelledMissed')}
        value={`${stats?.cancelled || 0}/${stats?.missed || 0}`}
        className="col-span-2 sm:col-span-1"
      />
    </div>
  );
}
