'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useCreateGroup, type CreateGroupDto } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect } from 'react';
import { getErrorMessage } from '@/shared/lib/api';

const createGroupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  level: z.string().max(50, 'Level must be at most 50 characters').optional().or(z.literal('')),
  maxStudents: z.number().int('Max students must be a whole number').min(1, 'Max students must be at least 1').max(50, 'Max students must be at most 50').optional(),
  centerId: z.string().min(1, 'Please select a center'),
  teacherId: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface CreateGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCenterId?: string;
}

export function CreateGroupForm({ open, onOpenChange, defaultCenterId }: CreateGroupFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createGroup = useCreateGroup();

  // Fetch centers and teachers for dropdowns
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ isActive: true });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });
  
  const centers = centersData?.items || [];
  const teachers = teachersData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      level: '',
      maxStudents: undefined,
      centerId: defaultCenterId || '',
      teacherId: '',
      isActive: true,
    },
  });

  // Watch centerId to update when defaultCenterId changes
  const centerId = watch('centerId');

  // Update centerId when defaultCenterId prop changes
  useEffect(() => {
    if (defaultCenterId && defaultCenterId !== centerId) {
      setValue('centerId', defaultCenterId);
    }
  }, [defaultCenterId, centerId, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        level: '',
        maxStudents: undefined,
        centerId: defaultCenterId || '',
        teacherId: '',
        isActive: true,
      });
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset, defaultCenterId]);

  const onSubmit = async (data: CreateGroupFormData) => {
    setErrorMessage(null);
    
    try {
      const payload: CreateGroupDto = {
        name: data.name,
        level: data.level || undefined,
        maxStudents: data.maxStudents,
        centerId: data.centerId,
        teacherId: data.teacherId || undefined,
        isActive: data.isActive ?? true,
      };

      await createGroup.mutateAsync(payload);
      
      // Show success message
      setSuccessMessage('Group created successfully!');
      setErrorMessage(null);
      
      // Reset form and close modal after a brief delay
      reset({
        name: '',
        level: '',
        maxStudents: undefined,
        centerId: defaultCenterId || '',
        teacherId: '',
        isActive: true,
      });
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
      const message = getErrorMessage(error, 'Failed to create group. Please try again.');
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Group</DialogTitle>
          <DialogDescription>
            Fill in the information below to create a new group. Fields marked with * are required.
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
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Beginner English A1"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                {...register('level')}
                error={errors.level?.message}
                placeholder="A1, A2, B1, etc."
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input
                id="maxStudents"
                type="number"
                {...register('maxStudents', { valueAsNumber: true })}
                error={errors.maxStudents?.message}
                placeholder="15"
                min={1}
                max={50}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="centerId">
              Center <span className="text-red-500">*</span>
            </Label>
            <select
              id="centerId"
              {...register('centerId')}
              disabled={isSubmitting || isLoadingCenters || centers.length === 0}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.centerId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || isLoadingCenters || centers.length === 0 ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">Select a center</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
            {errors.centerId && (
              <p className="text-sm text-red-600">{errors.centerId.message}</p>
            )}
            {isLoadingCenters && (
              <p className="text-sm text-slate-500">Loading centers...</p>
            )}
            {!isLoadingCenters && centers.length === 0 && (
              <p className="text-sm text-amber-600">No active centers available. Please create a center first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">Teacher (Optional)</Label>
            <select
              id="teacherId"
              {...register('teacherId')}
              disabled={isSubmitting || isLoadingTeachers}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.teacherId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || isLoadingTeachers ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <p className="text-sm text-red-600">{errors.teacherId.message}</p>
            )}
            {isLoadingTeachers && (
              <p className="text-sm text-slate-500">Loading teachers...</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              defaultChecked={true}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">
              Active (Group is currently active and accepting students)
            </Label>
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
              disabled={isSubmitting || isLoadingCenters || isLoadingTeachers || centers.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

