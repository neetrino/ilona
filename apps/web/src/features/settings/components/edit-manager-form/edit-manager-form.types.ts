import { z } from 'zod';
import type { UseFormReturn } from 'react-hook-form';
import type { ManagerAccount } from '@/features/settings';

export const activeManagerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  password: z
    .string()
    .max(128)
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: 'Password must be at least 8 characters',
    }),
  centerId: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const inactiveManagerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  password: z
    .string()
    .max(128)
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: 'Password must be at least 8 characters',
    }),
  centerId: z.string().optional(),
});

export type ActiveManagerFormData = z.infer<typeof activeManagerSchema>;
export type InactiveManagerFormData = z.infer<typeof inactiveManagerSchema>;

export interface EditManagerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager: ManagerAccount | null;
  variant?: 'active' | 'inactive';
}

export type ManagerFormFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  centerId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export type ManagerFormLike = Pick<
  UseFormReturn<ManagerFormFields>,
  'register' | 'formState' | 'watch' | 'setValue'
>;
