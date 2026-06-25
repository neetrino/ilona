'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { studentPillTrackClass } from './tokens';

export type StudentPillOption<T extends string> = { value: T; label: string };

const INDICATOR_TRANSITION =
  'transition-[transform,width,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

type SwitcherSize = 'sm' | 'md' | 'segment';
type SwitcherShape = 'pill' | 'rectangular';

const sizeConfig: Record<
  SwitcherSize,
  { track: string; button: string; indicatorRadius: string }
> = {
  sm: {
    track: cn(studentPillTrackClass, 'relative'),
    button: 'inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.6875rem] font-medium',
    indicatorRadius: 'rounded-full',
  },
  md: {
    track:
      'relative inline-flex h-10 max-w-full flex-wrap items-center rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] p-1',
    button: 'inline-flex h-8 items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-medium',
    indicatorRadius: 'rounded-full',
  },
  segment: {
    track: cn(studentPillTrackClass, 'relative'),
    button: 'inline-flex h-8 items-center justify-center rounded-full px-3 text-sm font-medium',
    indicatorRadius: 'rounded-full',
  },
};

const rectangularConfig: Record<
  'sm' | 'md',
  { track: string; button: string; indicatorRadius: string }
> = {
  sm: {
    track:
      'relative inline-flex max-w-full flex-wrap items-center rounded-lg border border-[rgba(14,14,16,0.12)] bg-[#f6f6f7] p-1 shadow-sm',
    button: 'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold',
    indicatorRadius: 'rounded-md shadow-sm',
  },
  md: {
    track:
      'relative flex h-11 w-full items-center rounded-lg border border-[rgba(14,14,16,0.12)] bg-[#f6f6f7] p-1.5 shadow-sm sm:inline-flex sm:w-auto',
    button:
      'inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-md px-2 text-sm font-semibold sm:min-w-[5.25rem] sm:flex-none sm:px-5',
    indicatorRadius: 'rounded-md shadow-sm',
  },
};

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
  const styles =
    shape === 'rectangular'
      ? rectangularConfig[size === 'md' ? 'md' : 'sm']
      : sizeConfig[size];
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });

  useEffect(() => {
    const syncIndicator = () => {
      const activeEl = buttonRefs.current[value];
      const trackEl = trackRef.current;
      if (!activeEl || !trackEl) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      setIndicator({
        x: activeEl.offsetLeft,
        y: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        visible: true,
      });
    };

    syncIndicator();
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
  }, [value, options]);

  return (
    <div ref={trackRef} className={cn(styles.track, className)}>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-0 top-0 z-0 bg-[#1010a3]',
          styles.indicatorRadius,
          INDICATOR_TRANSITION,
        )}
        style={{
          width: `${indicator.width}px`,
          height: `${indicator.height}px`,
          transform: `translate(${indicator.x}px, ${indicator.y}px)`,
          opacity: indicator.visible ? 1 : 0,
        }}
      />
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            ref={(node) => {
              buttonRefs.current[opt.value] = node;
            }}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 transition-colors duration-300 motion-reduce:transition-none',
              styles.button,
              isActive ? 'text-white' : 'text-[#3b3b40] hover:text-[#1010a3]',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
