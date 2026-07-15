import type { DailyPlan, DailyPlanResourceKind } from '../types';
import { DAILY_PLAN_RESOURCE_KINDS } from './daily-plan-editor.constants';
import type { DraftResource, DraftTopic } from './daily-plan-editor.types';

export function createDraftResourceKey(): string {
  return crypto.randomUUID();
}

export function emptyResource(kind: DailyPlanResourceKind): DraftResource {
  return {
    key: createDraftResourceKey(),
    kind,
    title: '',
    link: '',
    description: '',
  };
}

export function emptyTopic(): DraftTopic {
  return {
    title: '',
    resources: DAILY_PLAN_RESOURCE_KINDS.map((kind) => emptyResource(kind)),
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
      resources: DAILY_PLAN_RESOURCE_KINDS.flatMap((kind) => {
        const existing = topic.resources.filter((resource) => resource.kind === kind);
        if (existing.length === 0) {
          return [emptyResource(kind)];
        }
        return existing.map((resource) => ({
          key: createDraftResourceKey(),
          kind,
          title: resource.title ?? '',
          link: resource.link ?? '',
          description: resource.description ?? '',
        }));
      }),
    })),
  };
}

/** Insert after the last resource of the same kind so kind blocks stay contiguous. */
export function insertResourceAfterKind(
  resources: DraftResource[],
  kind: DailyPlanResourceKind,
): DraftResource[] {
  const next = emptyResource(kind);
  const lastIndex = resources.map((resource) => resource.kind).lastIndexOf(kind);
  if (lastIndex === -1) {
    return [...resources, next];
  }
  return [...resources.slice(0, lastIndex + 1), next, ...resources.slice(lastIndex + 1)];
}
