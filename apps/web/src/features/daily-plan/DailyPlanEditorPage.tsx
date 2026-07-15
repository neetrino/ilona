'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChatBackButton } from '@/shared/components/ui/chat-back-button';
import { useDailyPlanEditor } from './daily-plan-editor/useDailyPlanEditor';
import { DailyPlanEditorFormBody } from './daily-plan-editor/DailyPlanEditorFormBody';
import type { DailyPlan } from './types';

interface DailyPlanEditorPageProps {
  mode?: 'create' | 'edit';
  plan?: DailyPlan;
  listHref: string;
}

export function DailyPlanEditorPage({
  mode = 'create',
  plan,
  listHref,
}: DailyPlanEditorPageProps) {
  const router = useRouter();
  const tCommon = useTranslations('common');

  const goBack = () => {
    router.push(listHref);
  };

  const vm = useDailyPlanEditor({
    mode,
    plan,
    onClose: goBack,
    onSaved: goBack,
  });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex items-center gap-3">
        <ChatBackButton onClick={goBack} aria-label={tCommon('back')} />
      </div>
      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <DailyPlanEditorFormBody vm={vm} variant="page" />
      </div>
    </div>
  );
}
