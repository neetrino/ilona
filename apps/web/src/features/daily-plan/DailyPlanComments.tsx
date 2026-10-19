'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCreateDailyPlanComment, useDailyPlanComments } from './hooks';

export function DailyPlanComments({ planId }: { planId: string }) {
  const t = useTranslations('dailyPlanPage');
  const role = useAuthStore((state) => state.user?.role);
  const canComment = role === 'ADMIN' || role === 'MANAGER';
  const { data, isLoading, isError } = useDailyPlanComments(planId);
  const create = useCreateDailyPlanComment(planId);
  const [body, setBody] = useState('');

  async function submit() {
    const text = body.trim();
    if (!text || create.isPending) {
      return;
    }
    await create.mutateAsync(text);
    setBody('');
  }

  return (
    <section className="rounded-[15px] border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{t('commentsTitle')}</h3>
      {isLoading ? <p className="mt-3 text-sm text-slate-500">{t('commentsLoading')}</p> : null}
      {isError ? <p className="mt-3 text-sm text-red-600">{t('commentsLoadError')}</p> : null}
      <ul className="mt-3 space-y-3">
        {(data ?? []).map((comment) => (
          <li key={comment.id} className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">
              {comment.authorName} · {new Date(comment.createdAt).toLocaleString()}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{comment.body}</p>
          </li>
        ))}
      </ul>
      {(data ?? []).length === 0 && !isLoading ? (
        <p className="mt-3 text-sm text-slate-500">{t('commentsEmpty')}</p>
      ) : null}
      {canComment ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder={t('commentPlaceholder')}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={create.isPending || body.trim().length === 0}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {t('commentSubmit')}
          </button>
          {create.isError ? <p className="text-sm text-red-600">{t('commentFailed')}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
