'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BlogPostDto } from '@ilona/types';
import { Button } from '@/shared/components/ui';
import {
  useAdminBlogPosts,
  useCreateBlogPost,
  useDeleteBlogPost,
  useUpdateBlogPost,
} from '@/features/blog';
import { LatestNewsPostsList } from './LatestNewsPostsList';
import {
  EMPTY_LATEST_NEWS_FORM,
  LATEST_NEWS_ALLOWED_TYPES,
  LATEST_NEWS_MAX_IMAGE_SIZE,
  latestNewsInputClassName,
  latestNewsTextareaClassName,
  textToParagraphs,
  toLatestNewsFormState,
  type LatestNewsFormState,
} from './latestNewsForm.utils';

export function LatestNewsTab() {
  const t = useTranslations('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: posts = [], isLoading } = useAdminBlogPosts();
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const deleteMutation = useDeleteBlogPost();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LatestNewsFormState>(EMPTY_LATEST_NEWS_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const editingPost = useMemo(
    () => posts.find((post) => post.id === editingId) ?? null,
    [editingId, posts],
  );

  useEffect(() => {
    if (editingPost) {
      setForm(toLatestNewsFormState(editingPost));
      setImageFile(null);
    }
  }, [editingPost]);

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_LATEST_NEWS_FORM);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!LATEST_NEWS_ALLOWED_TYPES.has(file.type)) {
      setErrorMessage(t('latestNewsInvalidType'));
      return;
    }
    if (file.size > LATEST_NEWS_MAX_IMAGE_SIZE) {
      setErrorMessage(t('latestNewsFileTooLarge'));
      return;
    }
    setImageFile(file);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const bodyEn = textToParagraphs(form.bodyEn);
    const bodyHy = textToParagraphs(form.bodyHy);

    if (!form.titleEn.trim() || !form.titleHy.trim()) {
      setErrorMessage(t('latestNewsTitleRequired'));
      return;
    }
    if (bodyEn.length === 0 || bodyHy.length === 0) {
      setErrorMessage(t('latestNewsBodyRequired'));
      return;
    }
    if (!editingId && !imageFile) {
      setErrorMessage(t('latestNewsImageRequired'));
      return;
    }

    const publishedAt = new Date(`${form.publishedAt}T12:00:00.000Z`).toISOString();

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          payload: {
            titleEn: form.titleEn.trim(),
            titleHy: form.titleHy.trim(),
            bodyEn,
            bodyHy,
            publishedAt,
            isPublished: form.isPublished,
            image: imageFile,
          },
        });
        setSuccessMessage(t('latestNewsUpdatedSuccess'));
      } else {
        await createMutation.mutateAsync({
          titleEn: form.titleEn.trim(),
          titleHy: form.titleHy.trim(),
          bodyEn,
          bodyHy,
          publishedAt,
          isPublished: form.isPublished,
          image: imageFile,
        });
        setSuccessMessage(t('latestNewsCreatedSuccess'));
      }
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('latestNewsSaveFailed'));
    }
  };

  const handleEdit = (post: BlogPostDto) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingId(post.id);
  };

  const handleDelete = async (post: BlogPostDto) => {
    const confirmed = window.confirm(t('latestNewsDeleteConfirm', { title: post.titleEn }));
    if (!confirmed) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteMutation.mutateAsync(post.id);
      if (editingId === post.id) resetForm();
      setSuccessMessage(t('latestNewsDeletedSuccess'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('latestNewsDeleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-[#3b3b40]">{t('latestNewsTitle')}</h2>
        <p className="mb-6 text-sm text-[#8b8b90]">{t('latestNewsDescription')}</p>
        <LatestNewsPostsList
          posts={posts}
          isLoading={isLoading}
          isPending={isPending}
          loadingLabel={t('loading')}
          emptyLabel={t('latestNewsEmpty')}
          draftLabel={t('latestNewsDraft')}
          editLabel={t('latestNewsEdit')}
          removeLabel={t('remove')}
          onEdit={handleEdit}
          onDelete={(post) => void handleDelete(post)}
        />
      </div>

      <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#3b3b40]">
            {editingId ? t('latestNewsEditPost') : t('latestNewsCreatePost')}
          </h3>
          {editingId ? (
            <Button type="button" variant="outline" size="sm" onClick={resetForm} disabled={isPending}>
              {t('latestNewsCancelEdit')}
            </Button>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 tablet:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
                {t('latestNewsTitleEn')}
              </label>
              <input
                value={form.titleEn}
                onChange={(e) => setForm((current) => ({ ...current, titleEn: e.target.value }))}
                className={latestNewsInputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
                {t('latestNewsTitleHy')}
              </label>
              <input
                value={form.titleHy}
                onChange={(e) => setForm((current) => ({ ...current, titleHy: e.target.value }))}
                className={latestNewsInputClassName}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
              {t('latestNewsBodyEn')}
            </label>
            <textarea
              rows={5}
              value={form.bodyEn}
              onChange={(e) => setForm((current) => ({ ...current, bodyEn: e.target.value }))}
              className={latestNewsTextareaClassName}
              placeholder={t('latestNewsBodyHint')}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
              {t('latestNewsBodyHy')}
            </label>
            <textarea
              rows={5}
              value={form.bodyHy}
              onChange={(e) => setForm((current) => ({ ...current, bodyHy: e.target.value }))}
              className={latestNewsTextareaClassName}
              placeholder={t('latestNewsBodyHint')}
            />
          </div>

          <div className="grid gap-4 tablet:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
                {t('latestNewsPublishedAt')}
              </label>
              <input
                type="date"
                value={form.publishedAt}
                onChange={(e) =>
                  setForm((current) => ({ ...current, publishedAt: e.target.value }))
                }
                className={latestNewsInputClassName}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#3b3b40]">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, isPublished: e.target.checked }))
                  }
                  className="size-4 rounded border-[rgba(14,14,16,0.2)]"
                />
                {t('latestNewsPublished')}
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
              {t('latestNewsImage')}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileSelect}
              className="block w-full text-sm text-[#3b3b40]"
            />
            <p className="mt-1 text-xs text-[#8b8b90]">{t('imageFormats')}</p>
            {imageFile ? (
              <p className="mt-1 text-xs text-[#1010a3]">{imageFile.name}</p>
            ) : editingPost?.imageUrl ? (
              <p className="mt-1 text-xs text-[#8b8b90]">{t('latestNewsKeepCurrentImage')}</p>
            ) : null}
          </div>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-green-700">{successMessage}</p> : null}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="lg"
              className="h-11 min-h-11 rounded-[15px] bg-[#1010a3] px-6 py-0 text-white hover:bg-[#1010a3]/90"
              onClick={() => void handleSave()}
              disabled={isPending}
            >
              {isPending ? t('saving') : t('saveChanges')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
