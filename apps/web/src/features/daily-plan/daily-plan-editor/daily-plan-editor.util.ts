import type { DailyPlan } from '../types';
import { DAILY_PLAN_RESOURCE_KINDS } from './daily-plan-editor.constants';
import type { DraftTopic } from './daily-plan-editor.types';

export function emptyTopic(): DraftTopic {
  return {
    title: '',
    resources: DAILY_PLAN_RESOURCE_KINDS.map((kind) => ({
      kind,
      title: '',
      link: '',
      description: '',
    })),
  };
}

export function toDrafts(plan?: DailyPlan): {
  date: string;
  groupId: string;
  topics: DraftTopic[];
} {
  if (!plan) {
    return {
      date: new Date().toISOString().slice(0, 10),
      groupId: '',
      topics: [emptyTopic()],
    };
  }
  return {
    date: plan.date.slice(0, 10),
    groupId: plan.groupId ?? '',
    topics: plan.topics.map((topic) => ({
      title: topic.title,
      resources: DAILY_PLAN_RESOURCE_KINDS.map((kind) => {
        const existing = topic.resources.find((resource) => resource.kind === kind);
        return {
          kind,
          title: existing?.title ?? '',
          link: existing?.link ?? '',
          description: existing?.description ?? '',
        };
      }),
    })),
  };
}
