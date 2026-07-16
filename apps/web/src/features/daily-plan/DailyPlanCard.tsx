'use client';

import type { ReactNode } from 'react';
import { Calendar, Link2, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getAppDateLocaleTag } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
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
      className="flex h-full min-h-[20rem] cursor-pointer flex-col rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]"
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
      {/* Header */}
      <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8b8b90]">
        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{formatCardDate(plan.date, locale)}</span>
      </div>

      {/* Title */}
      <h3 className="mt-2 line-clamp-2 shrink-0 text-lg font-bold leading-snug text-[#111827]" title={teacherName(plan)}>
        {teacherName(plan)}
      </h3>

      {/* Metadata */}
      <div className="mt-2.5 flex min-h-[2rem] shrink-0 flex-wrap items-center gap-2">
        {hasMetaChips ? (
          <>
            {groupName && (
              <MetaChip icon={<Users className="h-3 w-3" aria-hidden="true" />} label={groupName} />
            )}
            {level && (
              <span className="inline-flex w-fit shrink-0 items-center rounded-lg bg-[#eef2ff] px-2 py-1 text-[11px] font-semibold text-[#1010a3]">
                {level}
              </span>
            )}
          </>
        ) : null}
      </div>

      <div className="mt-2.5 flex min-h-[2.75rem] shrink-0 flex-col justify-start gap-1.5">
        {branch ? (
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <MapPin className="h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden="true" />
            <span className="truncate" title={branch}>
              {branch}
            </span>
          </div>
        ) : null}
        {plan.lesson ? (
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Link2 className="h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden="true" />
            <span className="truncate">
              {t('linkedToLesson', { date: formatLinkedDate(plan.lesson.scheduledAt, locale) })}
            </span>
          </div>
        ) : null}
      </div>

      {/* Details / topics */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-[#e5e7eb] pt-3">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-0.5">
          {plan.topics.length > 0 ? (
            plan.topics.map((topic) => (
              <div key={topic.id} className="rounded-xl bg-[#f0f4ff] p-3">
                <h4
                  className="line-clamp-2 max-w-full border-b-2 border-[#1010a3] pb-0.5 text-sm font-semibold text-[#1010a3]"
                  title={topic.title}
                >
                  {topic.title}
                </h4>
                {topic.resources.length > 0 ? (
                  <ul className="mt-2 divide-y divide-slate-200/70">
                    {topic.resources.map((resource) => {
                      const resourceLabel = resource.description || resource.title;
                      return (
                        <li
                          key={resource.id}
                          className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                        >
                          <span className="shrink-0 text-sm font-medium text-[#374151]">
                            {kindLabel[resource.kind]}
                          </span>
                          <span
                            className="min-w-0 truncate text-right text-sm text-[#6b7280]"
                            title={resourceLabel}
                          >
                            {resource.link ? (
                              <a
                                href={resource.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#1010a3] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {resourceLabel}
                              </a>
                            ) : (
                              resourceLabel
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-[#8b8b90]">{t('noResources')}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-[#8b8b90]">{t('noTopics')}</p>
          )}
        </div>
      </div>

      {/* Actions — pinned to equal vertical position across cards */}
      <div
        className="mt-auto flex shrink-0 items-center justify-between gap-2 border-t border-[#e5e7eb] pt-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-medium text-[#1010a3]">{t('viewDetails')}</span>
        <div className="flex min-h-8 shrink-0 items-center gap-1">
          {plan.canEdit ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-[#1010a3] hover:bg-[#eef2ff] disabled:opacity-60`}
                aria-label={t('editDailyPlan')}
                title={tCommon('edit')}
                disabled={isDeletePending}
              >
                <Pencil className="h-4 w-4" />
              </button>
              {onDelete ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (isDeletePending) return;
                    if (confirm(t('deleteConfirm'))) {
                      await onDelete();
                    }
                  }}
                  className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60`}
                  aria-label={t('deleteDailyPlan')}
                  title={tCommon('delete')}
                  disabled={isDeletePending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
