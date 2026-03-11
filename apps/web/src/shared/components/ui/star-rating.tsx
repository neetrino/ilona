'use client';

import { useState, useCallback } from 'react';

const TOTAL_STARS = 5;

interface StarRatingProps {
  value: number; // 0 = none, 1-5 = selected
  onChange: (rating: number) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  value,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
}: StarRatingProps) {
  const [hoverIndex, setHoverIndex] = useState(0);

  const displayValue = hoverIndex > 0 ? hoverIndex : value;

  const handleClick = useCallback(
    (index: number) => {
      if (disabled) return;
      onChange(index);
    },
    [disabled, onChange]
  );

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };
  const starSize = sizeClasses[size];

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      onMouseLeave={() => setHoverIndex(0)}
      role="group"
      aria-label={`Rating: ${value} out of ${TOTAL_STARS} stars`}
    >
      {Array.from({ length: TOTAL_STARS }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;
        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            className={`inline-flex items-center justify-center p-0.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 disabled:pointer-events-none ${
              disabled ? 'cursor-default' : 'cursor-pointer hover:opacity-90'
            }`}
            onMouseEnter={() => !disabled && setHoverIndex(starValue)}
            onClick={() => handleClick(starValue)}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            aria-pressed={value === starValue}
          >
            <span
              className={`inline-block ${starSize} transition-colors`}
              aria-hidden
            >
              {filled ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-amber-400">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-slate-300">
                  <path strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
