import { z } from 'zod';

type TranslateFn = (key: string) => string;

export function createUpdateGroupFormSchema(tVal: TranslateFn, tForm: TranslateFn) {
  return z
    .object({
      name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')),
      level: z.string().max(50, tVal('levelMax')).optional().or(z.literal('')),
      description: z.string().max(500, tVal('descriptionMax')).optional().or(z.literal('')),
      centerId: z.string().min(1, tVal('centerRequired')),
      teacherId: z.string().min(1, tForm('noTeacherAssigned')),
      secondTeacherId: z.string().min(1, tForm('noTeacherAssigned')),
    })
    .refine((data) => data.teacherId !== data.secondTeacherId, {
      message: tForm('teachersMustDiffer'),
      path: ['secondTeacherId'],
    });
}
