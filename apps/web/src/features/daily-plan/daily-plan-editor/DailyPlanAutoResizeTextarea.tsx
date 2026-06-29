'use client';

import { useState, useEffect, useRef } from 'react';
import { dailyPlanTextareaClass } from './daily-plan-editor.styles';

interface DailyPlanAutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  resizeStorageKey: string;
}

export function DailyPlanAutoResizeTextarea({
  value,
  onChange,
  disabled = false,
  placeholder,
  resizeStorageKey,
}: DailyPlanAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const storageKey = `daily-plan-description-height:${resizeStorageKey}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedHeight = window.sessionStorage.getItem(storageKey);
    if (!savedHeight) return;
    const parsedHeight = Number(savedHeight);
    if (!Number.isNaN(parsedHeight) && parsedHeight > 0) {
      setHeight(parsedHeight);
    }
  }, [storageKey]);

  const persistHeight = () => {
    const el = textareaRef.current;
    if (!el || typeof window === 'undefined') return;
    const currentHeight = Math.round(el.getBoundingClientRect().height);
    if (currentHeight <= 0) return;
    setHeight(currentHeight);
    window.sessionStorage.setItem(storageKey, String(currentHeight));
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseUp={persistHeight}
      onTouchEnd={persistHeight}
      disabled={disabled}
      placeholder={placeholder}
      rows={2}
      style={height ? { height: `${height}px` } : undefined}
      className={dailyPlanTextareaClass}
    />
  );
}
