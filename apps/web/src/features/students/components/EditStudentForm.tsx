'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateStudent, useStudent, type UpdateStudentDto } from '@/features/students';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect } from 'react';
import type { UserStatus } from '@/types';

const updateStudentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  groupId: z.string().optional().or(z.literal('')),
  teacherId: z.string().optional().or(z.literal('')),
  parentName: z.string().max(100, 'Parent name must be at most 100 characters').optional().or(z.literal('')),
  parentPhone: z.string().max(50, 'Parent phone must be at most 50 characters').optional().or(z.literal('')),
  parentEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  monthlyFee: z.number().min(0, 'Monthly fee must be positive'),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional().or(z.literal('')),
  receiveReports: z.boolean().optional(),
});

type UpdateStudentFormData = z.infer<typeof updateStudentSchema>;

interface EditStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export function EditStudentForm({ open, onOpenChange, studentId }: EditStudentFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const updateStudent = useUpdateStudent();
  const { data: student, isLoading: isLoadingStudent } = useStudent(studentId, open);

  // Fetch groups and teachers for dropdowns
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ isActive: true });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });
  const groups = groupsData?.items || [];
  const teachers = teachersData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<UpdateStudentFormData>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      status: 'ACTIVE' as UserStatus,
      groupId: '',
      teacherId: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      monthlyFee: 0,
      notes: '',
      receiveReports: false,
    },
  });

  // Pre-fill form when student data is loaded
  useEffect(() => {
    if (student && open) {
      setValue('firstName', student.user?.firstName || '');
      setValue('lastName', student.user?.lastName || '');
      setValue('phone', student.user?.phone || '');
      setValue('status', (student.user?.status || 'ACTIVE') as UserStatus);
      setValue('groupId', student.groupId || '');
      setValue('teacherId', student.teacherId || '');
      setValue('parentName', student.parentName || '');
      setValue('parentPhone', student.parentPhone || '');
      setValue('parentEmail', student.parentEmail || '');
      setValue('monthlyFee', typeof student.monthlyFee === 'string' ? parseFloat(student.monthlyFee) || 0 : Number(student.monthlyFee || 0));
      setValue('notes', student.notes || '');
      setValue('receiveReports', student.receiveReports ?? true);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [student, open, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: UpdateStudentFormData) => {
    setErrorMessage(null);
    
    try {
      const payload: UpdateStudentDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        status: data.status,
        groupId: data.groupId || undefined,
        teacherId: data.teacherId || undefined,
        parentName: data.parentName || undefined,
        parentPhone: data.parentPhone || undefined,
        parentEmail: data.parentEmail || undefined,
        monthlyFee: data.monthlyFee,
        notes: data.notes || undefined,
        receiveReports: data.receiveReports,
      };

      await updateStudent.mutateAsync({ id: studentId, data: payload });
      
      // Show success message
      setSuccessMessage('Student updated successfully!');
      setErrorMessage(null);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: any) {
      // Handle error
      const message = error?.response?.data?.message || error?.message || 'Failed to update student. Please try again.';
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update the student information below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        {isLoadingStudent ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
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
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register('status')}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              {errors.status && (
                <p className="text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="teacherId">Teacher</Label>
                <select
                  id="teacherId"
                  {...register('teacherId')}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoadingTeachers || isSubmitting}
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName}
                      {teacher.user.phone ? ` - ${teacher.user.phone}` : ''}
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

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                Parent/Guardian Information
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent/Guardian Name</Label>
                  <Input
                    id="parentName"
                    {...register('parentName')}
                    error={errors.parentName?.message}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    {...register('parentPhone')}
                    error={errors.parentPhone?.message}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
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
                disabled={isSubmitting || updateStudent.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting || updateStudent.isPending}>
                {isSubmitting || updateStudent.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


