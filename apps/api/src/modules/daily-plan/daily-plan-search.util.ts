import { Prisma } from '@ilona/database';

function textContains(term: string): { contains: string; mode: 'insensitive' } {
  return { contains: term, mode: 'insensitive' };
}

function buildTeacherNameSearch(term: string): Prisma.DailyPlanWhereInput[] {
  const contains = textContains(term);
  const clauses: Prisma.DailyPlanWhereInput[] = [
    {
      teacher: {
        user: {
          OR: [{ firstName: contains }, { lastName: contains }],
        },
      },
    },
  ];

  const parts = term.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return clauses;
  }

  const first = parts[0];
  const rest = parts.slice(1).join(' ');
  clauses.push(
    {
      teacher: {
        user: {
          AND: [
            { firstName: textContains(first) },
            { lastName: textContains(rest) },
          ],
        },
      },
    },
    {
      teacher: {
        user: {
          AND: [
            { firstName: textContains(rest) },
            { lastName: textContains(first) },
          ],
        },
      },
    },
  );
  return clauses;
}

function buildCenterSearch(term: string): Prisma.CenterWhereInput {
  const contains = textContains(term);
  return { OR: [{ name: contains }, { address: contains }] };
}

/** Match teacher, group, center, topic, and resource fields shown on daily-plan cards. */
export function buildDailyPlanSearchWhere(term: string): Prisma.DailyPlanWhereInput {
  const contains = textContains(term);
  return {
    OR: [
      ...buildTeacherNameSearch(term),
      { group: { name: contains } },
      { group: { level: contains } },
      { group: { center: buildCenterSearch(term) } },
      { lesson: { group: { name: contains } } },
      { lesson: { group: { center: buildCenterSearch(term) } } },
      {
        topics: {
          some: {
            OR: [
              { title: contains },
              {
                resources: {
                  some: {
                    OR: [
                      { title: contains },
                      { description: contains },
                      { link: contains },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    ],
  };
}
