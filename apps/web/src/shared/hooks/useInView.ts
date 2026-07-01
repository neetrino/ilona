'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseInViewOptions {
  rootMargin?: string;
  triggerOnce?: boolean;
  threshold?: number | number[];
  initialInView?: boolean;
}

export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {},
): { ref: RefObject<T | null>; inView: boolean } {
  const {
    rootMargin = '300px',
    triggerOnce = true,
    threshold = 0,
    initialInView = false,
  } = options;

  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(initialInView);

  useEffect(() => {
    const element = ref.current;
    if (!element || (triggerOnce && inView)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
          return;
        }

        if (!triggerOnce) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, rootMargin, threshold, triggerOnce]);

  return { ref, inView };
}
