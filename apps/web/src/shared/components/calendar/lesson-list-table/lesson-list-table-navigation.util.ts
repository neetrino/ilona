import {
  getAdminDailyDutiesLessonPath,
  getTeacherDailyDutiesLessonPath,
  isAdminPortalPath,
} from '@/shared/lib/role-routes';

export function navigateToLessonDetail(lessonId: string, router: { push: (href: string) => void }) {
  const currentPath = window.location.pathname;
  if (isAdminPortalPath(currentPath.replace(/^\/[a-z]{2}\//, '/'))) {
    const role = currentPath.includes('/manager/') ? 'MANAGER' : 'ADMIN';
    router.push(getAdminDailyDutiesLessonPath(lessonId, role));
    return;
  }
  if (currentPath.includes('/teacher/')) {
    router.push(getTeacherDailyDutiesLessonPath(lessonId));
    return;
  }
  router.push(`/calendar/${lessonId}`);
}
