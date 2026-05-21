'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

const LEVELS = ['#f1f1f2', '#dae1ff', '#6868f8'] as const;
const ROWS = 5;
const COLS = 7;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type LearningActivityGridProps = {
  /** 0–100 overall engagement proxy */
  intensity: number;
};

function cellLevel(seed: number, intensity: number): (typeof LEVELS)[number] {
  const threshold = intensity / 100;
  const value = (seed % 100) / 100;
  if (value < threshold * 0.35) return LEVELS[0];
  if (value < threshold * 0.75) return LEVELS[1];
  return LEVELS[2];
}

export function LearningActivityGrid({ intensity }: LearningActivityGridProps) {
  const t = useTranslations('dashboard');
  const cells = useMemo(() => {
    const items: { color: string; key: string }[] = [];
    for (let col = 0; col < COLS; col += 1) {
      for (let row = 0; row < ROWS; row += 1) {
        const seed = col * 17 + row * 31 + Math.round(intensity);
        items.push({
          key: `${col}-${row}`,
          color: cellLevel(seed, intensity),
        });
      }
    }
    return items;
  }, [intensity]);

  return (
    <div className="border-t border-dashed border-[rgba(14,14,16,0.07)] pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.8125rem] font-bold text-[#1010a3]">{t('progress.learningActivity')}</p>
        <p className="text-[0.6875rem] text-[#8b8b90]">{t('progress.last7Weeks')}</p>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-x-1 gap-y-1 sm:gap-x-1.5">
        {DAY_LABELS.map((label, col) => (
          <div key={label + col} className="flex flex-col items-center gap-1">
            {Array.from({ length: ROWS }, (_, row) => {
              const cell = cells[col * ROWS + row];
              return (
                <span
                  key={cell?.key ?? row}
                  className="size-3.5 rounded sm:size-3.5"
                  style={{ backgroundColor: cell?.color ?? LEVELS[0] }}
                />
              );
            })}
            <span className="font-mono text-[0.59375rem] text-[#8b8b90]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
