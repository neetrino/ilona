'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="w-full">
        <div className="relative">
          <input
            type={visible ? 'text' : 'password'}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              'pl-3',
              error && 'border-destructive focus-visible:ring-destructive',
              className,
              'pr-14'
            )}
            ref={ref}
            {...props}
            disabled={disabled}
          />
          <button
            type="button"
            className={cn(
              'absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              disabled && 'pointer-events-none opacity-50'
            )}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            disabled={disabled}
          >
            {visible ? (
              <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Eye className="h-4 w-4 shrink-0" aria-hidden />
            )}
          </button>
        </div>
        {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
