import { z } from 'zod';

export const updateTeacherSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  experienceYears: z.number().int().min(0, 'Experience must be positive').max(80, 'Experience is too large').optional(),
  workingDays: z.array(z.string()).optional(),
});

export type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

