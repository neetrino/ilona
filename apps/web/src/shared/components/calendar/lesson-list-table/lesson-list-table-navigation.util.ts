import { isAdminPortalPath, getTeacherDailyDutiesLessonPath } from '@/shared/lib/role-routes';

export function navigateToLessonDetail(lessonId: string, router: { push: (href: string) => void }) {
  const currentPath = window.location.pathname;
  if (isAdminPortalPath(currentPath.replace(/^\/[a-z]{2}\//, '/'))) {
    const portalRoot = currentPath.includes('/manager/') ? '/manager' : '/admin';
    router.push(`${portalRoot}/calendar/${lessonId}`);
    return;
  }
  if (currentPath.includes('/teacher/')) {
    router.push(getTeacherDailyDutiesLessonPath(lessonId));
    return;
  }
  router.push(`/calendar/${lessonId}`);
}
