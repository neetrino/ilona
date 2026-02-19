import { z } from 'zod';

export const updateTeacherSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
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

export type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

