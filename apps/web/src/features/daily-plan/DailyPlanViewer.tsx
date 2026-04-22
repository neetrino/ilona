'use client';

import type { DailyPlan, DailyPlanResourceKind } from './types';

interface DailyPlanViewerProps {
  plan: DailyPlan;
  onClose: () => void;
}

const KIND_LABEL: Record<DailyPlanResourceKind, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
}

export function DailyPlanViewer({ plan, onClose }: DailyPlanViewerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Daily Plan</h2>
            <p className="text-sm text-slate-500">
              {formatDate(plan.date)} · {plan.group?.name ?? 'No group'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="p-5 space-y-4">
          {plan.topics.map((topic) => (
            <div
              key={topic.id}
              className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-2"
            >
              <h3 className="font-semibold text-slate-800">{topic.title}</h3>
              {topic.resources.length > 0 ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  {topic.resources.map((resource) => (
                    <li key={resource.id}>
                      <span className="text-slate-500 mr-2">
                        {KIND_LABEL[resource.kind]}:
                      </span>
                      {resource.link ? (
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {resource.title}
                        </a>
                      ) : (
                        <span>{resource.title}</span>
                      )}
                      {resource.description ? ` — ${resource.description}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No resources</p>
              )}
            </div>
          ))}
        </div>

        <footer className="flex justify-end p-4 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
