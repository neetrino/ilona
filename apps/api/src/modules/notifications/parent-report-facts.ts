import { PrismaService } from '../prisma/prisma.service';
import type { ParentReportFacts } from './parent-report-letter';
import type { QuarterBounds } from './parent-quarter.util';

const SKILL_LABELS: Record<string, string> = {
  READING: 'Ընթերցանություն',
  LISTENING: 'Լսում',
  WRITING: 'Գրավոր',
  SPEAKING: 'Խոսք',
  GRAMMAR: 'Քերականություն',
  CHALLENGE: 'Մարտահրավեր',
};

type PlanRecord = {
  topics: Array<{ title: string; resources: Array<{ kind: string }> }>;
};

type FeedbackRecord = {
  strengths: string | null;
  improvements: string | null;
  skillsNote: string | null;
  progress: string | null;
  encouragement: string | null;
  grammarTopics: string[];
  skills: string[];
};

export function factsFromRecords(plans: PlanRecord[], feedbacks: FeedbackRecord[]): ParentReportFacts {
  const topics = unique([
    ...plans.flatMap((plan) => plan.topics.map((topic) => topic.title)),
    ...feedbacks.flatMap((item) => item.grammarTopics),
  ]);
  const skills = unique([
    ...plans.flatMap((plan) =>
      plan.topics.flatMap((topic) => topic.resources.map((resource) => skillLabel(resource.kind))),
    ),
    ...feedbacks.flatMap((item) => item.skills.map(skillLabel)),
  ]);
  return {
    topics,
    skills,
    challenges: unique(feedbacks.flatMap((item) => [item.improvements, item.skillsNote])),
    achievements: unique(feedbacks.flatMap((item) => [item.strengths, item.progress, item.encouragement])),
  };
}

export async function loadQuarterFacts(
  prisma: PrismaService,
  studentId: string,
  groupId: string | null,
  bounds: QuarterBounds,
): Promise<ParentReportFacts> {
  const [plans, feedbacks] = await Promise.all([
    groupId
      ? prisma.dailyPlan.findMany({
          where: { groupId, date: { gte: bounds.start, lt: bounds.end } },
          select: {
            topics: { select: { title: true, resources: { select: { kind: true } } } },
          },
        })
      : Promise.resolve([]),
    prisma.feedback.findMany({
      where: { studentId, createdAt: { gte: bounds.start, lt: bounds.end } },
      select: {
        strengths: true,
        improvements: true,
        skillsNote: true,
        progress: true,
        encouragement: true,
        grammarTopics: true,
        skills: true,
      },
    }),
  ]);

  return factsFromRecords(plans, feedbacks);
}

function skillLabel(kind: string): string {
  const key = kind.trim().toUpperCase();
  return SKILL_LABELS[key] ?? kind.trim();
}

function unique(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const text = value?.trim();
    if (text) {
      seen.add(text);
    }
  }
  return [...seen];
}
