import { z } from 'zod';
import type { UserStatus } from '@/types';

export const updateStudentSchema = z.object({
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

export type UpdateStudentFormData = z.infer<typeof updateStudentSchema>;

