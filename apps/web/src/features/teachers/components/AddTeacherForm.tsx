'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useCreateTeacher, type CreateTeacherDto } from '@/features/teachers';
import { useState, useEffect } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useCenters } from '@/features/centers';

const createTeacherSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Password must be at most 50 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().optional(),
  hourlyRate: z.number().min(0, 'Per Lesson Rate must be positive'),
  videoUrl: z
    .string()
    .trim()
    .max(500, 'Video URL is too long')
    .url('Enter a valid URL (https://...)')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  centerIds: z.array(z.string()).optional(),
});

type CreateTeacherFormData = z.infer<typeof createTeacherSchema>;

interface AddTeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeacherForm({ open, onOpenChange }: AddTeacherFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createTeacher = useCreateTeacher();
  const { data: centersData } = useCenters({ isActive: true, take: 100 });
  const centers = centersData?.items ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      hourlyRate: 0,
      videoUrl: '',
      centerIds: [],
    },
  });

  const selectedCenterIds = watch('centerIds') ?? [];

  const toggleCenter = (centerId: string) => {
    const next = selectedCenterIds.includes(centerId)
      ? selectedCenterIds.filter((c) => c !== centerId)
      : [...selectedCenterIds, centerId];
    setValue('centerIds', next, { shouldDirty: true });
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateTeacherFormData) => {
    setErrorMessage(null);
    
    try {
      const payload: CreateTeacherDto = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        hourlyRate: data.hourlyRate,
        videoUrl: data.videoUrl || undefined,
        centerIds: data.centerIds && data.centerIds.length > 0 ? data.centerIds : undefined,
      };

      await createTeacher.mutateAsync(payload);
      
      // Show success message
      setSuccessMessage('Teacher created successfully!');
      setErrorMessage(null);
      
      // Reset form and close modal after a brief delay
      reset();
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
      const message = getErrorMessage(error, 'Failed to create teacher. Please try again.');
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogDescription>
            Fill in the information below to create a new teacher account. All fields marked with * are required.
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                {...register('firstName')}
                error={errors.firstName?.message}
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                {...register('lastName')}
                error={errors.lastName?.message}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="john.doe@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">
              Per Lesson Rate (֏) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              {...register('hourlyRate', { valueAsNumber: true })}
              error={errors.hourlyRate?.message}
              placeholder="5000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Public video URL</Label>
            <Input
              id="videoUrl"
              type="url"
              {...register('videoUrl')}
              error={errors.videoUrl?.message}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-slate-500">
              Optional. Shown on the teacher&apos;s public profile so students can preview their teaching style.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Centers (branches)</Label>
            {centers.length === 0 ? (
              <p className="text-xs text-slate-500">No centers available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {centers.map((center) => {
                  const active = selectedCenterIds.includes(center.id);
                  return (
                    <button
                      key={center.id}
                      type="button"
                      onClick={() => toggleCenter(center.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {center.name}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Select all branches this teacher belongs to. They will be visible in those centers.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              disabled={isSubmitting || createTeacher.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createTeacher.isPending}>
              {isSubmitting || createTeacher.isPending ? 'Creating...' : 'Create Teacher'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

