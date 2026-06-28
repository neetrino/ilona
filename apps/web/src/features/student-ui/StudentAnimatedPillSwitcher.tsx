'use client';

import { SegmentedControl } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

export type StudentPillOption<T extends string> = { value: T; label: string };

type SwitcherSize = 'sm' | 'md' | 'segment';
type SwitcherShape = 'pill' | 'rectangular';

type StudentAnimatedPillSwitcherProps<T extends string> = {
  options: StudentPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: SwitcherSize;
  shape?: SwitcherShape;
};

export function StudentAnimatedPillSwitcher<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'sm',
  shape = 'pill',
}: StudentAnimatedPillSwitcherProps<T>) {
  const optionCount = options.length;
  const minWidthClass =
    optionCount <= 2
      ? 'sm:min-w-[11rem]'
      : optionCount === 3
        ? 'sm:min-w-[16rem]'
        : 'sm:min-w-[20rem]';

  return (
    <SegmentedControl
      options={options.map((opt) => ({ id: opt.value, label: opt.label }))}
      value={value}
      onChange={(next) => onChange(next as T)}
      className={cn(
        'w-full',
        size === 'sm' ? minWidthClass : 'sm:min-w-[min(100%,20rem)]',
        shape === 'rectangular' && 'sm:w-auto',
        className,
      )}
      aria-label="Filter"
    />
  );
}
