'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface ActionButtonsProps {
  /**
   * Callback when edit button is clicked
   */
  onEdit?: () => void;
  
  /**
   * Callback when disable/deactivate button is clicked
   */
  onDisable?: () => void;
  
  /**
   * Callback when delete button is clicked
   */
  onDelete?: () => void;
  
  /**
   * Whether the item is currently active (affects disable button icon and label)
   */
  isActive?: boolean;
  
  /**
   * Whether any action is in progress (disables all buttons)
   */
  disabled?: boolean;
  
  /**
   * Whether edit action is disabled
   */
  editDisabled?: boolean;
  
  /**
   * Whether disable action is disabled
   */
  disableDisabled?: boolean;
  
  /**
   * Whether delete action is disabled
   */
  deleteDisabled?: boolean;
  
  /**
   * Custom class name for the container
   */
  className?: string;
  
  /**
   * Size variant: 'sm' for smaller icons (default) or 'md' for medium
   */
  size?: 'sm' | 'md';
  
  /**
   * Aria labels for accessibility
   */
  ariaLabels?: {
    edit?: string;
    disable?: string;
    delete?: string;
  };
  
  /**
   * Tooltip titles
   */
  titles?: {
    edit?: string;
    disable?: string;
    delete?: string;
  };
}

/**
 * Standardized action buttons component matching the reference design.
 * Enforces consistent order: Edit, Delete, Disable
 * Uses monochromatic dark grey icons on white background with clean minimalist styling.
 */
export function ActionButtons({
  onEdit,
  onDisable,
  onDelete,
  isActive = true,
  disabled = false,
  editDisabled = false,
  disableDisabled = false,
  deleteDisabled = false,
  className,
  size = 'sm',
  ariaLabels,
  titles,
}: ActionButtonsProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const padding = size === 'sm' ? 'p-1.5' : 'p-2';
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';

  const handleClick = (e: React.MouseEvent, callback?: () => void) => {
    e.stopPropagation();
    if (callback && !disabled) {
      callback();
    }
  };

  return (
    <div 
      className={cn('flex items-center justify-start', gap, className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Edit Button - Always first */}
      {onEdit && (
        <button
          type="button"
          aria-label={ariaLabels?.edit || 'Edit'}
          title={titles?.edit || 'Edit'}
          onClick={(e) => handleClick(e, onEdit)}
          disabled={disabled || editDisabled}
          className={cn(
            padding,
            'text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors duration-150 ease-out',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1',
            'active:scale-95'
          )}
        >
          <Pencil className={iconSize} aria-hidden="true" />
        </button>
      )}

      {/* Delete Button - Always second */}
      {onDelete && (
        <button
          type="button"
          aria-label={ariaLabels?.delete || 'Delete'}
          title={titles?.delete || 'Delete'}
          onClick={(e) => handleClick(e, onDelete)}
          disabled={disabled || deleteDisabled}
          className={cn(
            padding,
            'text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors duration-150 ease-out',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1',
            'active:scale-95'
          )}
        >
          <Trash2 className={iconSize} aria-hidden="true" />
        </button>
      )}

      {/* Toggle Switch - Always third */}
      {onDisable && (
        <label
          className={cn(
            'relative inline-flex items-center cursor-pointer',
            (disabled || disableDisabled) && 'opacity-50 cursor-not-allowed'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => {
              e.stopPropagation();
              if (!disabled && !disableDisabled && onDisable) {
                onDisable();
              }
            }}
            disabled={disabled || disableDisabled}
            className="sr-only peer"
            aria-label={ariaLabels?.disable || (isActive ? 'Deactivate' : 'Activate')}
            title={titles?.disable || (isActive ? 'Deactivate' : 'Activate')}
          />
          <div className={cn(
            'w-9 h-5 rounded-full transition-colors duration-150 ease-out',
            'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-400 peer-focus:ring-offset-1',
            isActive ? 'bg-green-500' : 'bg-slate-300',
            (disabled || disableDisabled) && 'opacity-50'
          )}>
            <div className={cn(
              'absolute top-[2px] left-[2px] bg-white rounded-full h-4 w-4 transition-transform duration-150 ease-out',
              'border border-slate-300',
              isActive && 'translate-x-4'
            )} />
          </div>
        </label>
      )}
    </div>
  );
}

