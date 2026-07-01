import {
  getAdminDailyDutiesBasePath,
  isAdminPortalPath,
  TEACHER_DAILY_DUTIES_BASE_PATH,
} from '@/shared/lib/role-routes';
import { buildDailyDutiesLessonDetailHref } from '@/features/daily-duties/components/daily-duties-url.util';

export function navigateToLessonDetail(
  lessonId: string,
  router: { push: (href: string) => void },
  locale: string,
) {
  const currentPath = window.location.pathname;
  const normalizedPath = currentPath.replace(/^\/[a-z]{2}\//, '/');
  if (isAdminPortalPath(normalizedPath)) {
    const role = currentPath.includes('/manager/') ? 'MANAGER' : 'ADMIN';
    router.push(
      buildDailyDutiesLessonDetailHref({
        locale,
        portalBasePath: getAdminDailyDutiesBasePath(role),
        lessonId,
      }),
    );
    return;
  }
  router.push(
    buildDailyDutiesLessonDetailHref({
      locale,
      portalBasePath: TEACHER_DAILY_DUTIES_BASE_PATH,
      lessonId,
    }),
  );
}
