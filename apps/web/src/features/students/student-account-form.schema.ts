import { z } from 'zod';
import { ISO_DATE_RE, resolveDateOfBirthToIso } from './student-dob-date';

export { ISO_DATE_RE } from './student-dob-date';

export function computeAgeFromDob(dob: string | undefined): number | undefined {
  const iso = resolveDateOfBirthToIso(dob);
  if (!iso) return undefined;
  const birth = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : undefined;
}

function preprocessManualAge(val: unknown): number | undefined {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.trunc(n);
}

const optionalFormDate = z.union([
  z
    .string()
    .refine((value) => resolveDateOfBirthToIso(value) !== undefined, 'Use DD/MM/YYYY format'),
  z.literal(''),
]);

const optionalDob = optionalFormDate;

const createStudentBaseSchema = z.object({
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
  dateOfBirth: optionalDob.optional(),
  manualAge: z.preprocess(preprocessManualAge, z.number().int().min(1).max(120).optional()),
  firstLessonDate: optionalFormDate.optional(),
  /** Matches CRM lead level ids (filters group list only; not sent to API). */
  levelId: z.string().max(10).optional(),
  groupId: z.string().optional(),
  teacherId: z.string().optional(),
  centerId: z.string().optional(),
  parentName: z.string().max(100, 'Parent name must be at most 100 characters').optional(),
  parentSurname: z.string().max(100, 'Parent surname must be at most 100 characters').optional(),
  parentPhone: z.string().max(50, 'Parent phone must be at most 50 characters').optional(),
  parentEmail: z.union([z.string().email('Please enter a valid email address'), z.literal('')]).optional(),
  parentPassportInfo: z.string().max(100, 'Passport info must be at most 100 characters').optional(),
  monthlyFee: z.number().min(0, 'Monthly fee must be positive'),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
  receiveReports: z.boolean().optional(),
});

function applyCreateStudentBusinessRules(
  data: z.infer<typeof createStudentBaseSchema>,
  ctx: z.RefinementCtx,
): void {
  const fromDob = computeAgeFromDob(data.dateOfBirth?.trim() || undefined);
  const fromManual = data.manualAge;
  if (fromDob === undefined && (fromManual === undefined || fromManual < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter date of birth or age (1–120)',
      path: ['dateOfBirth'],
    });
  }
  const effectiveAge = fromDob ?? fromManual;
  if (effectiveAge !== undefined && effectiveAge < 18) {
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
}

/** Same validation as Add New Student — reuse for CRM Paid registration. */
export const createStudentSchema = createStudentBaseSchema.superRefine(applyCreateStudentBusinessRules);

export const createStudentWithConfirmSchema = createStudentBaseSchema
  .extend({
    confirmPassword: z.string().min(1, 'Please confirm the password'),
  })
  .superRefine(applyCreateStudentBusinessRules)
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type CreateStudentFormData = z.infer<typeof createStudentSchema>;
export type CreateStudentWithConfirmFormData = z.infer<typeof createStudentWithConfirmSchema>;
