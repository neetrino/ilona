'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { cn } from '@/shared/lib/utils';
import { portaledDropdownDialogHandlers } from './single-select-dropdown';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SHEET_CONTENT_CLASS =
  'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full max-h-[calc(94dvh+7px)] translate-x-0 translate-y-0 gap-4 overflow-y-auto overscroll-contain rounded-t-[22px] border border-slate-200 bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full lg:inset-auto lg:bottom-auto lg:left-[50%] lg:top-[50%] lg:max-h-[90vh] lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%] lg:overflow-hidden lg:rounded-lg lg:p-6 lg:duration-200 lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:slide-out-to-left-1/2 lg:data-[state=closed]:slide-out-to-top-[48%] lg:data-[state=open]:slide-in-from-left-1/2 lg:data-[state=open]:slide-in-from-top-[48%] lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=closed]:slide-out-to-bottom-0';

const CENTERED_CONTENT_CLASS =
  'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg';

/** Admin portal bottom sheet on mobile; lg+ falls back to small centered dialog card. */
const PORTAL_SHEET_CONTENT_CLASS =
  'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full h-[calc(94dvh+7px)] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl lg:inset-auto lg:bottom-auto lg:left-[50%] lg:top-[50%] lg:h-auto lg:max-h-[90vh] lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%] lg:overflow-y-auto lg:overflow-x-hidden lg:rounded-lg lg:gap-4 lg:p-6 lg:bg-background lg:duration-200 lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:slide-out-to-left-1/2 lg:data-[state=closed]:slide-out-to-top-[48%] lg:data-[state=open]:slide-in-from-left-1/2 lg:data-[state=open]:slide-in-from-top-[48%] lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=closed]:slide-out-to-bottom-0';

const PORTAL_SHEET_BODY_CLASS =
  'min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:contents lg:overflow-visible lg:p-0 lg:pb-0 lg:pt-0';

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  overlayClassName?: string;
  /** Bottom sheet on mobile, centered dialog on lg+ (default: true). */
  sheet?: boolean;
  /** Admin-style portal sheet on mobile; lg+ uses small centered dialog card. */
  variant?: 'default' | 'portal';
  /** Hide the top-right close control on mobile (sheet closed via drag handle). */
  hideCloseButton?: boolean;
  closeButtonClassName?: string;
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, overlayClassName, children, sheet = true, variant = 'default', hideCloseButton = false, closeButtonClassName, ...props }, ref) => {
  const isPortalSheet = variant === 'portal';
  const useSheet = sheet || isPortalSheet;
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    enabled: useSheet,
    onClose: () => closeRef.current?.click(),
  });

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el || !useSheet) return;

    const observer = new MutationObserver(() => {
      if (el.getAttribute('data-state') === 'closed') {
        resetDrag();
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] });
    return () => observer.disconnect();
  }, [resetDrag, useSheet]);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const closeButtonClasses = cn(
    'absolute right-4 top-4 rounded-sm border-0 opacity-70 outline-none ring-0 ring-offset-0 transition-opacity hover:opacity-100 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none data-[state=open]:bg-transparent data-[state=open]:text-muted-foreground',
    closeButtonClassName,
  );

  return (
    <DialogPortal>
      <DialogOverlay
        className={cn(
          useSheet && (isPortalSheet ? 'bg-black/60 lg:bg-black/80' : 'bg-black/60 lg:bg-black/80'),
          overlayClassName,
        )}
      />
      <DialogPrimitive.Content
        ref={setRefs}
        style={useSheet ? dragStyle : undefined}
        className={cn(
          isPortalSheet
            ? PORTAL_SHEET_CONTENT_CLASS
            : useSheet
              ? SHEET_CONTENT_CLASS
              : CENTERED_CONTENT_CLASS,
          className,
        )}
        {...portaledDropdownDialogHandlers}
        {...props}
        aria-describedby={props['aria-describedby'] ?? undefined}
      >
        {useSheet ? (
          <div
            className={cn(
              'relative flex h-9 w-full shrink-0 items-center justify-center',
              isPortalSheet ? 'bg-[#f8f9fb] lg:hidden' : 'lg:hidden',
            )}
          >
            <div
              className="absolute inset-x-0 -top-2 h-14"
              style={isPortalSheet ? { touchAction: 'pan-y' } : undefined}
              {...dragHandleProps}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
        ) : null}
        {isPortalSheet ? <div className={PORTAL_SHEET_BODY_CLASS}>{children}</div> : children}
        <DialogClose ref={closeRef} className="hidden" />
        {!isPortalSheet && hideCloseButton ? (
          <DialogPrimitive.Close
            className={cn(
              closeButtonClasses,
              'hidden lg:inline-flex lg:items-center lg:justify-center',
              useSheet && 'top-3 lg:top-4',
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
        {isPortalSheet ? (
          <DialogPrimitive.Close
            className={cn(closeButtonClasses, 'hidden lg:inline-flex lg:items-center lg:justify-center lg:top-4')}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
        {!isPortalSheet && !hideCloseButton ? (
          <DialogPrimitive.Close className={cn(closeButtonClasses, useSheet && 'top-3 lg:top-4')}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
