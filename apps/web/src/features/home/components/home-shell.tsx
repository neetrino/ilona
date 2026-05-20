import { cn } from '@/shared/lib/utils';

/** Shared outer padding + max-width — must match between header and all home sections. */
export const HOME_SHELL_OUTER_CLASS = 'w-full px-2 sm:px-3 md:px-4 lg:px-4';

/** Inner horizontal padding — matches `HomeNavigation` nav row (`px-3` … `lg:px-6`). */
export const HOME_SHELL_INNER_X_CLASS = 'px-3 sm:px-4 md:px-5 lg:px-6';

export const HOME_CONTAINER_CLASS = 'mx-auto w-full max-w-[1600px]';

interface HomeShellProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function HomeShell({ children, className, innerClassName }: HomeShellProps) {
  return (
    <div className={cn(HOME_SHELL_OUTER_CLASS, className)}>
      <div className={cn(HOME_CONTAINER_CLASS, innerClassName)}>{children}</div>
    </div>
  );
}
