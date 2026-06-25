import { z } from 'zod';
import { createOptionalExperienceYearsSchema } from '@/features/teachers/utils/experience';

export const updateTeacherSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  experienceYears: createOptionalExperienceYearsSchema((key) => {
    const messages: Record<string, string> = {
      experienceInt: 'Experience must be a whole number',
      experienceMin: 'Experience must be positive',
      experienceMax: 'Experience is too large',
    };
    return messages[key] ?? key;
  }),
  workingDays: z.array(z.string()).optional(),
});

export type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
