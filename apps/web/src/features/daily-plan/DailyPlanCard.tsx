'use client';

import type { ReactNode } from 'react';
import { Calendar, Link2, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getAppDateLocaleTag } from '@/shared/lib/utils';
import type { DailyPlan, DailyPlanResourceKind } from './types';

function formatCardDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date
    .toLocaleDateString(getAppDateLocaleTag(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();
}

function formatLinkedDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(getAppDateLocaleTag(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function teacherName(plan: DailyPlan): string {
  return `${plan.teacher.user.firstName} ${plan.teacher.user.lastName}`.trim();
}

function centerName(plan: DailyPlan): string | null {
  return plan.group?.center?.name ?? plan.lesson?.group?.center?.name ?? null;
}

function MetaChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-lg border border-[rgba(14,14,16,0.08)] bg-[#fafafa] px-2 py-1">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[#6b7280] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        {icon}
      </span>
      <span className="truncate text-[11px] font-medium text-[#374151]" title={label}>
        {label}
      </span>
    </div>
  );
}

interface DailyPlanCardProps {
  plan: DailyPlan;
  kindLabel: Record<DailyPlanResourceKind, string>;
  onView: () => void;
  onEdit: () => void;
  onDelete?: () => Promise<void>;
  isDeletePending: boolean;
}

export function DailyPlanCard({
  plan,
  kindLabel,
  onView,
  onEdit,
  onDelete,
  isDeletePending,
}: DailyPlanCardProps) {
  const locale = useLocale();
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');

  const branch = centerName(plan);
  const groupName = plan.group?.name ?? plan.lesson?.group?.name ?? null;
  const level = plan.group?.level ?? null;
  const hasMetaChips = Boolean(groupName || level);

  return (
    <article
      className="flex cursor-pointer flex-col rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]"
      onClick={onView}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8b8b90]">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{formatCardDate(plan.date, locale)}</span>
        </div>
        {plan.canEdit && (
          <div className="flex shrink-0 items-start gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#1010a3] hover:bg-[#eef2ff] disabled:opacity-60"
              aria-label={t('editDailyPlan')}
              title={tCommon('edit')}
              disabled={isDeletePending}
            >
              <Pencil className="h-4 w-4" />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (isDeletePending) return;
                  if (confirm(t('deleteConfirm'))) {
                    await onDelete();
                  }
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={t('deleteDailyPlan')}
                title={tCommon('delete')}
                disabled={isDeletePending}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="mt-2 text-lg font-bold leading-snug text-[#111827]">{teacherName(plan)}</h3>

      {hasMetaChips && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {groupName && (
            <MetaChip icon={<Users className="h-3 w-3" aria-hidden="true" />} label={groupName} />
          )}
          {level && (
            <span className="inline-flex w-fit shrink-0 items-center rounded-lg bg-[#eef2ff] px-2 py-1 text-[11px] font-semibold text-[#1010a3]">
              {level}
            </span>
          )}
        </div>
      )}

      {branch && (
        <div className="mt-2.5 flex items-center gap-2 text-sm text-[#6b7280]">
          <MapPin className="h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden="true" />
          <span className="truncate">{branch}</span>
        </div>
      )}

      {plan.lesson && (
        <div className="mt-1.5 flex items-center gap-2 text-sm text-[#6b7280]">
          <Link2 className="h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden="true" />
          <span className="truncate">
            {t('linkedToLesson', { date: formatLinkedDate(plan.lesson.scheduledAt, locale) })}
          </span>
        </div>
      )}

      {plan.topics.length > 0 && (
        <>
          <div className="mt-4 border-b border-[#e5e7eb]" />
          <div className="mt-3 space-y-3">
            {plan.topics.map((topic) => (
              <div key={topic.id} className="rounded-xl bg-[#f0f4ff] p-3">
                <h4 className="inline-block border-b-2 border-[#1010a3] pb-0.5 text-sm font-semibold text-[#1010a3]">
                  {topic.title}
                </h4>
                {topic.resources.length > 0 ? (
                  <ul className="mt-2 divide-y divide-slate-200/70">
                    {topic.resources.map((resource) => (
                      <li
                        key={resource.id}
                        className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                      >
                        <span className="shrink-0 text-sm font-medium text-[#374151]">
                          {kindLabel[resource.kind]}
                        </span>
                        <span className="min-w-0 truncate text-right text-sm text-[#6b7280]">
                          {resource.link ? (
                            <a
                              href={resource.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1010a3] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {resource.description || resource.title}
                            </a>
                          ) : (
                            resource.description || resource.title
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-[#8b8b90]">{t('noResources')}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
