'use client';

import { BookMarked, ExternalLink } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  DAILY_PLAN_KIND_ICON,
  DAILY_PLAN_KIND_ICON_SURFACE_CLASS,
  DAILY_PLAN_KIND_SURFACE_CLASS,
  DAILY_PLAN_KIND_TITLE_CLASS,
  DAILY_PLAN_RESOURCE_KINDS,
} from './daily-plan-editor/daily-plan-editor.constants';
import type { DailyPlanResource, DailyPlanResourceKind, DailyPlanTopic } from './types';

function resourcesByKind(topic: DailyPlanTopic) {
  return DAILY_PLAN_RESOURCE_KINDS.map((kind) => ({
    kind,
    resources: topic.resources.filter((resource) => resource.kind === kind),
  })).filter((group) => group.resources.length > 0);
}

function ResourceItem({
  resource,
  kindLabel,
}: {
  resource: DailyPlanResource;
  kindLabel: string;
}) {
  const body =
    resource.kind === 'CHALLENGE' ? (
      <p className="text-sm leading-snug text-slate-700">{resource.description}</p>
    ) : resource.link ? (
      <a
        href={resource.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-[#1010a3] hover:underline"
      >
        <span className="min-w-0 break-words">{resource.title}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      </a>
    ) : (
      <p className="text-sm font-medium leading-snug text-slate-800">{resource.title}</p>
    );

  return (
    <li className="rounded-[12px] border border-white/70 bg-white/80 px-3 py-2.5 shadow-[0_1px_2px_rgba(14,14,16,0.04)]">
      <span className="sr-only">{kindLabel}</span>
      {body}
      {resource.kind !== 'CHALLENGE' && resource.description ? (
        <p className="mt-1 text-xs leading-snug text-slate-500">{resource.description}</p>
      ) : null}
    </li>
  );
}

interface DailyPlanViewerTopicSectionProps {
  topic: DailyPlanTopic;
  index: number;
  kindLabel: Record<DailyPlanResourceKind, string>;
  noResourcesLabel: string;
  topicLabel: string;
}

export function DailyPlanViewerTopicSection({
  topic,
  index,
  kindLabel,
  noResourcesLabel,
  topicLabel,
}: DailyPlanViewerTopicSectionProps) {
  const groups = resourcesByKind(topic);

  return (
    <section className="overflow-hidden rounded-[18px] border border-[rgba(14,14,16,0.08)] bg-white shadow-[0_2px_10px_rgba(14,14,16,0.04)]">
      <header className="flex items-start gap-3 border-b border-[rgba(14,14,16,0.06)] bg-[#f8f8fc] px-4 py-3.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ececff] text-[#1010a3]"
          aria-hidden
        >
          <BookMarked className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b90]">
            {topicLabel}
          </p>
          <h3 className="mt-0.5 break-words text-base font-semibold leading-snug text-[#1010a3]">
            {topic.title}
          </h3>
        </div>
        <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-[#1010a3] px-2 text-xs font-bold text-white">
          {index + 1}
        </span>
      </header>

      <div className="space-y-3 p-4">
        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">{noResourcesLabel}</p>
        ) : (
          groups.map(({ kind, resources }) => {
            const KindIcon = DAILY_PLAN_KIND_ICON[kind];
            return (
              <div
                key={kind}
                className={cn(
                  'space-y-2.5 rounded-[15px] border p-3.5',
                  DAILY_PLAN_KIND_SURFACE_CLASS[kind],
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-2 text-xs font-semibold uppercase tracking-wide',
                    DAILY_PLAN_KIND_TITLE_CLASS[kind],
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.875rem]',
                      DAILY_PLAN_KIND_ICON_SURFACE_CLASS[kind],
                    )}
                    aria-hidden
                  >
                    <KindIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </span>
                  {kindLabel[kind]}
                </div>
                <ul className="space-y-2">
                  {resources.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      kindLabel={kindLabel[kind]}
                    />
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
