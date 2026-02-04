'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useCreateStudent, type CreateStudentDto } from '@/features/students';
import { useGroups } from '@/features/groups';
import { useState, useEffect } from 'react';

const createStudentSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Password must be at most 50 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().optional(),
  age: z.number().int('Age must be a whole number').min(1, 'Age must be at least 1').max(120, 'Age must be reasonable'),
  groupId: z.string().optional(),
  parentName: z.string().max(100, 'Parent name must be at most 100 characters').optional(),
  parentPhone: z.string().max(50, 'Parent phone must be at most 50 characters').optional(),
  parentEmail: z.union([z.string().email('Please enter a valid email address'), z.literal('')]).optional(),
  monthlyFee: z.number().min(0, 'Monthly fee must be positive'),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
  receiveReports: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // If age is under 18, parent fields are required
  if (data.age !== undefined && data.age < 18) {
    if (!data.parentName || data.parentName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Parent/Guardian name is required for students under 18',
        path: ['parentName'],
      });
    }
    if (!data.parentPhone || data.parentPhone.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Parent/Guardian phone is required for students under 18',
        path: ['parentPhone'],
      });
    }
    if (!data.parentEmail || data.parentEmail.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Parent/Guardian email is required for students under 18',
        path: ['parentEmail'],
      });
    } else if (data.parentEmail && !z.string().email().safeParse(data.parentEmail).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid email address',
        path: ['parentEmail'],
      });
    }
  }
});

type CreateStudentFormData = z.infer<typeof createStudentSchema>;

interface AddStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStudentForm({ open, onOpenChange }: AddStudentFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createStudent = useCreateStudent();
  
  // Fetch groups for dropdown
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ isActive: true });
  const groups = groupsData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
      defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      age: undefined as number | undefined,
      groupId: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      monthlyFee: 0,
      notes: '',
      receiveReports: true,
    },
  });

  // Watch age value to conditionally show parent section
  const age = watch('age');
  const showParentSection = age !== undefined && age < 18;

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  // Clear parent fields when age becomes 18 or older
  useEffect(() => {
    if (age !== undefined && age >= 18) {
      setValue('parentName', '');
      setValue('parentPhone', '');
      setValue('parentEmail', '');
    }
  }, [age, setValue]);

  const onSubmit = async (data: CreateStudentFormData) => {
    setErrorMessage(null);
    
    try {
      const payload: CreateStudentDto = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        groupId: data.groupId || undefined,
        parentName: data.parentName || undefined,
        parentPhone: data.parentPhone || undefined,
        parentEmail: data.parentEmail || undefined,
        monthlyFee: data.monthlyFee,
        notes: data.notes || undefined,
        receiveReports: data.receiveReports ?? true,
      };

      await createStudent.mutateAsync(payload);
      
      // Show success message
      setSuccessMessage('Student created successfully!');
      setErrorMessage(null);
      
      // Reset form and close modal after a brief delay
      reset();
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: any) {
      // Handle error
      const message = error?.response?.data?.message || error?.message || 'Failed to create student. Please try again.';
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Fill in the information below to create a new student account. All fields marked with * are required.
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
            <Label htmlFor="age">
              Age <span className="text-red-500">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              min="1"
              max="120"
              {...register('age', { valueAsNumber: true })}
              error={errors.age?.message}
              placeholder="Enter student's age"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">Group</Label>
            <select
              id="groupId"
              {...register('groupId')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoadingGroups}
            >
              <option value="">No group assigned</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} {group.level ? `(${group.level})` : ''}
                </option>
              ))}
            </select>
            {errors.groupId && (
              <p className="text-sm text-red-600">{errors.groupId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyFee">
              Monthly Fee (AMD) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="monthlyFee"
              type="number"
              step="0.01"
              min="0"
              {...register('monthlyFee', { valueAsNumber: true })}
              error={errors.monthlyFee?.message}
              placeholder="50000"
            />
          </div>

          {showParentSection && (
            <div className="border-t pt-4 transition-all duration-300 ease-in-out">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Parent/Guardian Information
                <span className="text-red-500 ml-1">*</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Required for students under 18 years of age
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parentName">
                    Parent/Guardian Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentName"
                    {...register('parentName')}
                    error={errors.parentName?.message}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhone">
                    Parent/Guardian Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    {...register('parentPhone')}
                    error={errors.parentPhone?.message}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail">
                    Parent/Guardian Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    {...register('parentEmail')}
                    error={errors.parentEmail?.message}
                    placeholder="parent@example.com"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes about the student..."
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="receiveReports"
              {...register('receiveReports')}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="receiveReports" className="text-sm font-normal cursor-pointer">
              Receive progress reports via email
            </Label>
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
              disabled={isSubmitting || createStudent.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createStudent.isPending}>
              {isSubmitting || createStudent.isPending ? 'Creating...' : 'Create Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

