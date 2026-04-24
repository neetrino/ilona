import { z } from 'zod';

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function computeAgeFromDob(dob: string | undefined): number | undefined {
  if (!dob || !ISO_DATE_RE.test(dob)) return undefined;
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : undefined;
}

/** Same validation as Add New Student — reuse for CRM Paid registration. */
export const createStudentSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password must be at most 50 characters'),
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be at most 50 characters'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be at most 50 characters'),
    phone: z.string().optional(),
    dateOfBirth: z
      .string()
      .regex(ISO_DATE_RE, 'Use YYYY-MM-DD format')
      .refine((v) => computeAgeFromDob(v) !== undefined, 'Invalid date of birth'),
    firstLessonDate: z
      .union([z.string().regex(ISO_DATE_RE, 'Use YYYY-MM-DD format'), z.literal('')])
      .optional(),
    age: z.number().int().min(1).max(120).optional(),
    groupId: z.string().optional(),
    teacherId: z.string().optional(),
    centerId: z.string().optional(),
    parentName: z.string().max(100, 'Parent name must be at most 100 characters').optional(),
    parentPhone: z.string().max(50, 'Parent phone must be at most 50 characters').optional(),
    parentEmail: z.union([z.string().email('Please enter a valid email address'), z.literal('')]).optional(),
    parentPassportInfo: z.string().max(100, 'Passport info must be at most 100 characters').optional(),
    monthlyFee: z.number().min(0, 'Monthly fee must be positive'),
    notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
    receiveReports: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const computedAge = computeAgeFromDob(data.dateOfBirth);
    if (computedAge !== undefined && computedAge < 18) {
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
      if (!data.parentPassportInfo || data.parentPassportInfo.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Parent passport information is required for students under 18',
          path: ['parentPassportInfo'],
        });
      }
    }
  });

export type CreateStudentFormData = z.infer<typeof createStudentSchema>;
