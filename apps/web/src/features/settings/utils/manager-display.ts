import type { ManagerAccount } from '../types';

export function formatManagerDateTime(
  iso: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function getLastManagedInfo(manager: ManagerAccount): {
  centerName: string | null;
  managedAt: string | null;
} {
  const last = manager.managerProfile?.lastManaged;
  if (last?.centerName && last.managedAt) {
    return { centerName: last.centerName, managedAt: last.managedAt };
  }
  return { centerName: null, managedAt: null };
}

export function isActiveCenterManager(manager: ManagerAccount): boolean {
  return (
    manager.status === 'ACTIVE' &&
    manager.managerProfile?.isCurrentAssignment !== false &&
    Boolean(manager.managerProfile?.centerId)
  );
}

export function getCentersTakenByActiveManagers(
  managers: ManagerAccount[],
  excludeManagerId?: string,
): Set<string> {
  const taken = new Set<string>();
  managers.forEach((m) => {
    if (excludeManagerId && m.id === excludeManagerId) return;
    if (isActiveCenterManager(m) && m.managerProfile?.centerId) {
      taken.add(m.managerProfile.centerId);
    }
  });
  return taken;
}

export function getPendingCenterId(manager: ManagerAccount): string | undefined {
  if (manager.status === 'ACTIVE') return undefined;
  return manager.managerProfile?.centerId;
}
