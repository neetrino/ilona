'use client';

import { Pencil, Ban, Trash2 } from 'lucide-react';
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
 * Enforces consistent order: Edit, Disable, Delete
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
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const padding = size === 'sm' ? 'p-2' : 'p-2.5';
  const gap = size === 'sm' ? 'gap-2' : 'gap-2.5';

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
            'text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1'
          )}
        >
          <Pencil className={iconSize} aria-hidden="true" />
        </button>
      )}

      {/* Disable/Deactivate Button - Always second */}
      {onDisable && (
        <button
          type="button"
          aria-label={ariaLabels?.disable || (isActive ? 'Deactivate' : 'Activate')}
          title={titles?.disable || (isActive ? 'Deactivate' : 'Activate')}
          onClick={(e) => handleClick(e, onDisable)}
          disabled={disabled || disableDisabled}
          className={cn(
            padding,
            'text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1'
          )}
        >
          <Ban className={iconSize} aria-hidden="true" />
        </button>
      )}

      {/* Delete Button - Always third */}
      {onDelete && (
        <button
          type="button"
          aria-label={ariaLabels?.delete || 'Delete'}
          title={titles?.delete || 'Delete'}
          onClick={(e) => handleClick(e, onDelete)}
          disabled={disabled || deleteDisabled}
          className={cn(
            padding,
            'text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1'
          )}
        >
          <Trash2 className={iconSize} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

