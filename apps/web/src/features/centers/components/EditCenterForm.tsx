'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateCenter, useCenter, type UpdateCenterDto } from '@/features/centers';
import { useState, useEffect, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib/api';

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
}

export function EditCenterForm({ open, onOpenChange, centerId }: EditCenterFormProps) {
  const tForm = useTranslations('centers.form');
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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open]);

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
        isActive: data.isActive,
      };

      await updateCenter.mutateAsync({ id: centerId, data: payload });
      
      // Show success message
      setSuccessMessage(tForm('updatedSuccess'));
      setErrorMessage(null);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const isActive = watch('isActive');

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tForm('editTitle')}</DialogTitle>
            <DialogDescription>{tForm('loadingCenter')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-500">{tCommon('loading')}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tForm('editTitle')}</DialogTitle>
          <DialogDescription>{tForm('editDescription')}</DialogDescription>
        </DialogHeader>

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

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="address">{tForm('address')}</Label>
            <Input
              id="address"
              {...register('address')}
              error={errors.address?.message}
              placeholder={tForm('addressPlaceholder')}
            />
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
              <div className="relative">
                <input
                  type="color"
                  id="colorHex"
                  value={watch('colorHex') || '#253046'}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setValue('colorHex', newValue, { shouldValidate: true });
                  }}
                  className="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
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
                    // Normalize hex color on blur
                    const value = watch('colorHex');
                    if (value && value.startsWith('#')) {
                      // Already has #, just validate
                      return;
                    } else if (value && !value.startsWith('#')) {
                      // Add # if missing
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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                {tForm('activeCenter')}
              </Label>
            </div>
            <p className="text-sm text-slate-500">
              {isActive ? tForm('activeCenterHint') : tForm('inactiveCenterHint')}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

