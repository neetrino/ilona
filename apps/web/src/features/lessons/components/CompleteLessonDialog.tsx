'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/shared/components/ui';

interface CompleteLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  lessonName?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function CompleteLessonDialog({
  open,
  onOpenChange,
  onConfirm,
  lessonName,
  isLoading = false,
  error,
}: CompleteLessonDialogProps) {
  const t = useTranslations('lessons');
  const tCommon = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('markLessonCompleted')}</DialogTitle>
          <DialogDescription>
            {lessonName
              ? t('markLessonCompletedConfirmWithName', { name: lessonName })
              : t('markLessonCompletedConfirm')}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? t('completing') : t('markAsCompleted')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
