'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useLandingCanvasScale } from '@/shared/hooks/useLandingCanvasScale';
import {
  LANDING_CANVAS_MIN_WIDTH,
  LANDING_DESIGN_WIDTH,
} from '@/shared/lib/landing-layout';
import { cn } from '@/shared/lib/utils';

type CanvasScalerProps = {
  children: ReactNode;
  designWidth?: number;
  minWidth?: number;
  className?: string;
};

export function CanvasScaler({
  children,
  designWidth = LANDING_DESIGN_WIDTH,
  minWidth = LANDING_CANVAS_MIN_WIDTH,
  className,
}: CanvasScalerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { scale, isCanvasActive, offsetX } = useLandingCanvasScale(designWidth, minWidth);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) {
      return;
    }

    const measure = () => {
      setContentHeight(contentEl.offsetHeight);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(contentEl);

    return () => observer.disconnect();
  }, []);

  const wrapHeight = isCanvasActive ? contentHeight * scale : contentHeight;

  const contentStyle: CSSProperties | undefined = isCanvasActive
    ? {
        width: designWidth,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        marginLeft: offsetX,
        // Collapse pre-transform layout box so it does not extend below the scaled visual height.
        marginBottom:
          contentHeight > 0 && scale < 1 ? contentHeight * (scale - 1) : undefined,
      }
    : undefined;

  const wrapStyle: CSSProperties | undefined =
    wrapHeight > 0 || isCanvasActive
      ? {
          ...(wrapHeight > 0 ? { height: wrapHeight } : {}),
          ['--landing-canvas-offset-x' as string]: `${offsetX}px`,
        }
      : undefined;

  return (
    <div
      ref={wrapRef}
      className={cn('w-full overflow-hidden', className)}
      style={wrapStyle}
    >
      <div ref={contentRef} className={cn(isCanvasActive ? 'relative' : 'w-full')} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
