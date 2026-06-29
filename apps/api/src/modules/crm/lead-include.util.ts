export function leadInclude() {
  return {
    createdByUser: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    assignedManager: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    teacher: {
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    },
    group: {
      select: {
        id: true,
        name: true,
        level: true,
        center: { select: { id: true, name: true } },
      },
    },
    center: {
      select: { id: true, name: true },
    },
    attachments: true,
    activities: {
      take: 20,
      orderBy: { createdAt: 'desc' as const },
    },
    student: {
      select: { id: true },
    },
  };
}
