'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { BlogPostDto } from '@ilona/types';
import {
  useAdminBlogPosts,
  useCreateBlogPost,
  useDeleteBlogPost,
  useUpdateBlogPost,
} from '@/features/blog';
import { LatestNewsFormPanel } from './LatestNewsFormPanel';
import { LatestNewsPostsSection } from './LatestNewsPostsSection';
import {
  EMPTY_LATEST_NEWS_FORM,
  LATEST_NEWS_ALLOWED_TYPES,
  LATEST_NEWS_MAX_IMAGE_SIZE,
  textToParagraphs,
  toLatestNewsFormState,
  type LatestNewsFormState,
} from '../../settings/components/latestNewsForm.utils';

export function LatestNewsPageContent() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const isHy = locale === 'hy';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
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

  const scrollToForm = () => {
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_LATEST_NEWS_FORM);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = () => {
    resetForm();
    setErrorMessage(null);
    setSuccessMessage(null);
    scrollToForm();
  };

  const handleFileSelect = (file: File) => {
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
    scrollToForm();
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
    <div className="space-y-6 tablet:space-y-8">
      <LatestNewsPostsSection
        posts={posts}
        isLoading={isLoading}
        isPending={isPending}
        isHy={isHy}
        selectedId={editingId}
        title={t('latestNewsTitle')}
        description={t('latestNewsDescription')}
        loadingLabel={t('loading')}
        emptyLabel={t('latestNewsEmpty')}
        draftLabel={t('latestNewsDraft')}
        editHintLabel={t('latestNewsEdit')}
        removeLabel={t('remove')}
        createLabel={t('latestNewsCreatePost')}
        onCreate={handleCreate}
        onSelect={handleEdit}
        onDelete={(post) => void handleDelete(post)}
      />

      <LatestNewsFormPanel
        editingId={editingId}
        form={form}
        imageFile={imageFile}
        currentImageUrl={editingPost?.imageUrl ?? null}
        isPending={isPending}
        errorMessage={errorMessage}
        successMessage={successMessage}
        labels={{
          createTitle: t('latestNewsCreatePost'),
          editTitle: t('latestNewsEditPost'),
          cancelEdit: t('latestNewsCancelEdit'),
          titleEn: t('latestNewsTitleEn'),
          titleHy: t('latestNewsTitleHy'),
          titleEnPlaceholder: t('latestNewsTitleEnPlaceholder'),
          titleHyPlaceholder: t('latestNewsTitleHyPlaceholder'),
          bodyEn: t('latestNewsBodyEn'),
          bodyHy: t('latestNewsBodyHy'),
          bodyHint: t('latestNewsBodyHint'),
          publishedAt: t('latestNewsPublishedAt'),
          published: t('latestNewsPublished'),
          image: t('latestNewsImage'),
          formats: t('imageFormats'),
          chooseImage: t('latestNewsChooseImage'),
          changeImage: t('latestNewsChangeImage'),
          keepCurrentImage: t('latestNewsKeepCurrentImage'),
          save: t('saveChanges'),
          saving: t('saving'),
        }}
        fileInputRef={fileInputRef}
        formSectionRef={formSectionRef}
        onChange={setForm}
        onFileSelect={handleFileSelect}
        onCancel={resetForm}
        onSave={() => void handleSave()}
      />
    </div>
  );
}
