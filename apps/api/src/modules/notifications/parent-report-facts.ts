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
      },
    }),
  ]);

  const topics = unique(plans.flatMap((plan) => plan.topics.map((topic) => topic.title)));
  const skills = unique(
    plans.flatMap((plan) =>
      plan.topics.flatMap((topic) => topic.resources.map((resource) => SKILL_LABELS[resource.kind] ?? resource.kind)),
    ),
  );
  return {
    topics,
    skills,
    challenges: unique(feedbacks.flatMap((item) => [item.improvements, item.skillsNote])),
    achievements: unique(feedbacks.flatMap((item) => [item.strengths, item.progress, item.encouragement])),
  };
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
