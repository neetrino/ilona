'use client';


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button, Input, Label } from '@/shared/components/ui';
import { useUpdateCenter, useCenter, type UpdateCenterDto } from '@/features/centers';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { X, Trash2 } from 'lucide-react';

type UpdateCenterFormData = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  colorHex?: string;
  isActive?: boolean;
};

interface EditCenterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId: string;
  onToggleActive?: () => void;
  onDelete?: () => void;
  isStatusTogglePending?: boolean;
}

export function EditCenterForm({
  open,
  onOpenChange,
  centerId,
  onToggleActive,
  onDelete,
  isStatusTogglePending = false,
}: EditCenterFormProps) {
  const tForm = useTranslations('centers.form');
  const tCenters = useTranslations('centers');
  const tVal = useTranslations('centers.validation');
  const tCommon = useTranslations('common');

  const updateCenterSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')).optional(),
        address: z.string().max(255, tVal('addressMax')).optional().or(z.literal('')),
        phone: z.string().max(50, tVal('phoneMax')).optional().or(z.literal('')),
        email: z.union([z.string().email(tVal('invalidEmail')), z.literal('')]).optional(),
        description: z.string().max(500, tVal('descriptionMax')).optional().or(z.literal('')),
        colorHex: z
          .union([
            z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, tVal('invalidHexColor')),
            z.literal(''),
          ])
          .optional()
          .or(z.literal('')),
        isActive: z.boolean().optional(),
      }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(updateCenterSchema), [updateCenterSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateCenter = useUpdateCenter();
  const { data: center, isLoading } = useCenter(centerId, open);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UpdateCenterFormData>({
    resolver,
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      colorHex: '',
      isActive: true,
    },
  });

  // Update form when center data loads
  useEffect(() => {
    if (center) {
      reset({
        name: center.name,
        address: center.address || '',
        phone: center.phone || '',
        email: center.email || '',
        description: center.description || '',
        colorHex: center.colorHex || '',
        isActive: center.isActive,
      });
    }
  }, [center, reset]);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches;

  const resetDragRefs = () => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  };

  const handleDragStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = firstTouch.clientY;
    touchStartXRef.current = firstTouch.clientX;
    setIsSettling(false);
    setIsDragging(true);
  };

  const handleDragMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    const deltaY = firstTouch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    if (deltaY <= 0 || deltaY <= deltaX) return;
    event.preventDefault();
    setDragOffsetY(Math.min(deltaY * 0.95, 340));
  };

  const handleDragEnd = () => {
    if (!isMobileViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      requestClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  };

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;

  const onSubmit = async (data: UpdateCenterFormData) => {
    setErrorMessage(null);
    
    try {
      const payload: UpdateCenterDto = {
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        description: data.description || undefined,
        colorHex: data.colorHex && data.colorHex.trim() !== '' ? data.colorHex : undefined,
        isActive: center?.isActive,
      };

      await updateCenter.mutateAsync({ id: centerId, data: payload });
      
      // Show success message
      setSuccessMessage(tForm('updatedSuccess'));
      setErrorMessage(null);
      
      // Close modal after a brief delay
      setTimeout(() => {
        requestClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const isCenterActive = center?.isActive ?? true;
  const isFormBusy = isSubmitting || updateCenter.isPending || isStatusTogglePending;
  const headerTitle = center?.name ?? tForm('editTitle');

  const dialogGridRows =
    'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl';

  const renderHeaderActions = () => (
    <div className="flex shrink-0 items-center gap-3">
      {onDelete ? (
        <button
          type="button"
          aria-label={tCenters('deleteCenter')}
          title={tCenters('deleteCenter')}
          disabled={isFormBusy}
          onClick={onDelete}
          className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {onToggleActive ? (
        <button
          type="button"
          role="switch"
          aria-checked={isCenterActive}
          aria-label={isCenterActive ? tCenters('deactivateCenter') : tCenters('activateCenter')}
          disabled={isFormBusy}
          onClick={onToggleActive}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            isCenterActive ? 'bg-green-500' : 'bg-[#f1f1f2]',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform',
              isCenterActive ? 'translate-x-5 border-white' : 'translate-x-0.5',
            )}
          />
        </button>
      ) : null}
      <DialogPrimitive.Close
        className={`${ADMIN_ICON_BUTTON_SM_CLASS} hidden shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex`}
        aria-label={tCommon('close')}
      >
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </div>
  );

  if (isLoading) {
    return (
      <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', isBaseLayer)} />
          <DialogPrimitive.Content style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
            className={cn(
              'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
              'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
              'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
              'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
              PORTAL_DESKTOP_SIDE_SHEET_CLASS,
            )}
            aria-describedby={undefined}
          >
            <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
              <div
                className="absolute inset-x-0 -top-2 h-14"
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onTouchCancel={handleDragEnd}
              />
              <div className="h-1.5 w-14 rounded-full bg-slate-400" />
            </div>
            <DialogPrimitive.Title className="sr-only">{headerTitle}</DialogPrimitive.Title>
            <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-[#3b3b40]">{headerTitle}</h2>
                  <p className="mt-1 text-sm text-[#8b8b90]">{tForm('loadingCenter')}</p>
                </div>
                {renderHeaderActions()}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">{tCommon('loading')}</div>
              </div>
            </div>
          </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            dialogGridRows,
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{headerTitle}</DialogPrimitive.Title>
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-[#3b3b40]">{headerTitle}</h2>
              </div>
              {renderHeaderActions()}
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="name">
                    {tForm('centerName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    error={errors.name?.message}
                    placeholder={tForm('namePlaceholder')}
                  />
                </div>

                <div className="min-w-0 space-y-2">
                  <Label htmlFor="address">{tForm('address')}</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    error={errors.address?.message}
                    placeholder={tForm('addressPlaceholder')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{tForm('phone')}</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    error={errors.phone?.message}
                    placeholder={tForm('phonePlaceholder')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">{tForm('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    placeholder={tForm('emailPlaceholder')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">{tForm('description')}</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder={tForm('descriptionPlaceholder')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="colorHex">{tForm('centerColor')}</Label>
                <div className="flex items-center gap-3">
                  <div className="group relative h-11 w-11 shrink-0">
                    <span
                      className="pointer-events-none block h-full w-full rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.18)] transition-transform group-hover:scale-105"
                      style={{ backgroundColor: watch('colorHex') || '#253046' }}
                      aria-hidden
                    />
                    <input
                      type="color"
                      id="colorHex"
                      value={watch('colorHex') || '#253046'}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setValue('colorHex', newValue, { shouldValidate: true });
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label={tForm('centerColor')}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="colorHexText"
                      value={watch('colorHex') || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setValue('colorHex', newValue, { shouldValidate: true });
                      }}
                      onBlur={() => {
                        const value = watch('colorHex');
                        if (value && value.startsWith('#')) {
                          return;
                        } else if (value && !value.startsWith('#')) {
                          setValue('colorHex', `#${value}`, { shouldValidate: true });
                        }
                      }}
                      error={errors.colorHex?.message}
                      placeholder={tForm('colorPlaceholder')}
                      className="font-mono"
                    />
                  </div>
                  {watch('colorHex') && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        reset({
                          ...watch(),
                          colorHex: '',
                        });
                      }}
                      className="text-sm"
                    >
                      {tForm('resetToDefault')}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-slate-500">{tForm('colorHint')}</p>
              </div>
              
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestClose}
                  disabled={isSubmitting}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmitting ? tForm('saving') : tForm('saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

