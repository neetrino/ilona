'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useCreateCenter, type CreateCenterDto } from '@/features/centers';
import { useState, useEffect } from 'react';
import { getErrorMessage } from '@/shared/lib/api';

const createCenterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  address: z.string().max(255, 'Address must be at most 255 characters').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().or(z.literal('')),
  email: z.union([z.string().email('Please enter a valid email address'), z.literal('')]).optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().or(z.literal('')),
  colorHex: z.union([
    z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color (e.g., #253046)'),
    z.literal(''),
  ]).optional().or(z.literal('')),
});

type CreateCenterFormData = z.infer<typeof createCenterSchema>;

interface CreateCenterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCenterForm({ open, onOpenChange }: CreateCenterFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createCenter = useCreateCenter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateCenterFormData>({
    resolver: zodResolver(createCenterSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      colorHex: '',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateCenterFormData) => {
    setErrorMessage(null);
    
    try {
      const payload: CreateCenterDto = {
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        description: data.description || undefined,
        colorHex: data.colorHex && data.colorHex.trim() !== '' ? data.colorHex : undefined,
      };

      await createCenter.mutateAsync(payload);
      
      // Show success message
      setSuccessMessage('Center created successfully!');
      setErrorMessage(null);
      
      // Reset form and close modal after a brief delay
      reset();
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
      const message = getErrorMessage(error, 'Failed to create center. Please try again.');
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Center</DialogTitle>
          <DialogDescription>
            Fill in the information below to create a new center/branch. Fields marked with * are required.
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
            <Label htmlFor="colorHex">Center Color (Optional)</Label>
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
            </div>
            <p className="text-sm text-slate-500">
              Choose a color for this center's card in Board view. The header will use this color, and the body will use a lighter shade.
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
              {isSubmitting ? 'Creating...' : 'Create Center'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

