'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useCreateTeacher, type CreateTeacherDto } from '@/features/teachers';
import { WeeklySchedule } from './WeeklySchedule';
import { useState, useEffect } from 'react';
import { getErrorMessage } from '@/shared/lib/api';

const createTeacherSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Password must be at most 50 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  workingDays: z.array(z.string()).optional(),
  workingHours: z
    .object({
      MON: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      TUE: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      WED: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      THU: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      FRI: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      SAT: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      SUN: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    })
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const hasDays = Object.keys(val).length > 0;
        if (!hasDays) return false;
        // Validate each day's time ranges
        for (const day of Object.keys(val)) {
          const ranges = val[day as keyof typeof val];
          if (ranges && Array.isArray(ranges)) {
            for (const range of ranges) {
              if (range.start >= range.end) return false;
            }
            // Check for overlaps
            for (let i = 0; i < ranges.length; i++) {
              for (let j = i + 1; j < ranges.length; j++) {
                const r1 = ranges[i];
                const r2 = ranges[j];
                if (
                  (r1.start < r2.end && r1.end > r2.start) ||
                  (r2.start < r1.end && r2.end > r1.start)
                ) {
                  return false;
                }
              }
            }
          }
        }
        return true;
      },
      {
        message: 'At least one day must be selected with valid, non-overlapping time ranges',
      }
    ),
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
      workingDays: [],
      workingHours: undefined,
    },
  });

  const workingHours = watch('workingHours');

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
      // Extract working days from workingHours
      const workingDays = data.workingHours ? Object.keys(data.workingHours) : [];
      
      const payload: CreateTeacherDto = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        hourlyRate: data.hourlyRate,
        workingDays: workingDays.length > 0 ? workingDays : undefined,
        workingHours: data.workingHours && Object.keys(data.workingHours).length > 0 ? data.workingHours : undefined,
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
              Hourly Rate (AMD) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              {...register('hourlyRate', { valueAsNumber: true })}
              error={errors.hourlyRate?.message}
              placeholder="25.00"
            />
          </div>

          <div className="space-y-2">
            <WeeklySchedule
              value={workingHours}
              onChange={(schedule) => setValue('workingHours', schedule)}
              error={errors.workingHours?.message}
            />
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

