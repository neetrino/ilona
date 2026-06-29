import { z } from 'zod';

export type AddLessonFormData = {
  groupId: string;
  teacherId: string;
};

export type AddLessonFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultTime?: string;
};

export function createAddLessonFormSchema(tVal: (key: string) => string) {
  return z.object({
    groupId: z.string().min(1, tVal('selectGroup')),
    teacherId: z.string().min(1, tVal('selectTeacher')),
  });
}
