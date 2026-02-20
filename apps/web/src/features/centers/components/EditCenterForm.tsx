'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateCenter, useCenter, type UpdateCenterDto } from '@/features/centers';
import { useState, useEffect } from 'react';
import { getErrorMessage } from '@/shared/lib/api';

const updateCenterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').optional(),
  address: z.string().max(255, 'Address must be at most 255 characters').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().or(z.literal('')),
  email: z.union([z.string().email('Please enter a valid email address'), z.literal('')]).optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().or(z.literal('')),
  colorHex: z.union([
    z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color (e.g., #253046)'),
    z.literal(''),
  ]).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

type UpdateCenterFormData = z.infer<typeof updateCenterSchema>;

interface EditCenterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId: string;
}

export function EditCenterForm({ open, onOpenChange, centerId }: EditCenterFormProps) {
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
    resolver: zodResolver(updateCenterSchema),
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
      setSuccessMessage('Center updated successfully!');
      setErrorMessage(null);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
      const message = getErrorMessage(error, 'Failed to update center. Please try again.');
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
            <DialogTitle>Edit Center</DialogTitle>
            <DialogDescription>Loading center information...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-500">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Center</DialogTitle>
          <DialogDescription>
            Update the center information below. All changes will be saved immediately.
          </DialogDescription>
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
              Center Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Main Branch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register('address')}
              error={errors.address?.message}
              placeholder="123 Main Street, City, Country"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="center@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Additional information about this center..."
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorHex">Center Color</Label>
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
                  placeholder="#253046"
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
                  Reset to default
                </Button>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Choose a color for this center's card in Board view. The header will use this color, and the body will use a lighter shade.
            </p>
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
                Active Center
              </Label>
            </div>
            <p className="text-sm text-slate-500">
              {isActive ? 'This center is currently active and can be used for new groups.' : 'This center is inactive and cannot be used for new groups.'}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

