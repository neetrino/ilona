import type { PortalNotification } from '@ilona/types';
import type { UserRole } from '@/types';
import { toRolePortalPath } from '@/shared/lib/role-routes';

function studentRecordingChatHref(item: PortalNotification): string | null {
  if (item.type !== 'STUDENT_RECORDING_MISSING') {
    return null;
  }
  const teacherId = item.data?.teacherId;
  const lessonId = item.data?.lessonId;
  if (!teacherId || !lessonId) {
    return null;
  }
  return (
    `/student/chat?type=dm&teacherId=${encodeURIComponent(teacherId)}` +
    `&record=1&lessonId=${encodeURIComponent(lessonId)}`
  );
}

export function notificationHref(
  item: PortalNotification,
  locale: string,
  role?: UserRole | null,
): string | null {
  const recordingHref = studentRecordingChatHref(item);
  const raw = recordingHref ?? item.data?.href;
  if (!raw) {
    return null;
  }
  const path = toRolePortalPath(raw, role);
  return `/${locale}${path}`;
}
