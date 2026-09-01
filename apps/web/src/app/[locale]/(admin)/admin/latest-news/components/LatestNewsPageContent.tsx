'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { BlogPostDto } from '@ilona/types';
import {
  useAdminBlogPosts,
  useCreateBlogPost,
  useDeleteBlogPost,
  useUpdateBlogPost,
} from '@/features/blog';
import { AutoDismissToast } from '@/shared/components/ui';
import { getBlogPostCoverUrl } from '@/features/landing/landingBlogContent';
import { LatestNewsFormSheet } from './LatestNewsFormSheet';
import {
  LatestNewsPostsSection,
  type LatestNewsViewMode,
} from './LatestNewsPostsSection';
import { LatestNewsPublishConfirmDialog } from './LatestNewsPublishConfirmDialog';
import {
  EMPTY_LATEST_NEWS_FORM,
  LATEST_NEWS_ALLOWED_TYPES,
  LATEST_NEWS_MAX_IMAGE_SIZE,
  textToParagraphs,
  toLatestNewsFormState,
  type LatestNewsFormState,
} from '../../settings/components/latestNewsForm.utils';

type PublishConfirmState = {
  post: BlogPostDto;
  nextIsPublished: boolean;
};

export function LatestNewsPageContent() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isHy = locale === 'hy';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: posts = [], isLoading } = useAdminBlogPosts();
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const deleteMutation = useDeleteBlogPost();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<LatestNewsFormState>(EMPTY_LATEST_NEWS_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publishConfirm, setPublishConfirm] = useState<PublishConfirmState | null>(null);
  const [viewMode, setViewMode] = useState<LatestNewsViewMode>('active');

  const activePosts = useMemo(
    () => posts.filter((post) => post.isPublished),
    [posts],
  );
  const archivedPosts = useMemo(
    () => posts.filter((post) => !post.isPublished),
    [posts],
  );
  const visiblePosts = viewMode === 'archive' ? archivedPosts : activePosts;

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

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_LATEST_NEWS_FORM);
    setImageFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(EMPTY_LATEST_NEWS_FORM);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
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
      setViewMode(form.isPublished ? 'active' : 'archive');
      closeForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('latestNewsSaveFailed'));
    }
  };

  const handleEdit = (post: BlogPostDto) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingId(post.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (post: BlogPostDto) => {
    const confirmed = window.confirm(t('latestNewsDeleteConfirm', { title: post.titleEn }));
    if (!confirmed) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteMutation.mutateAsync(post.id);
      if (editingId === post.id) closeForm();
      setSuccessMessage(t('latestNewsDeletedSuccess'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('latestNewsDeleteFailed'));
    }
  };

  const handleTogglePublished = async (post: BlogPostDto, isPublished: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateMutation.mutateAsync({
        id: post.id,
        payload: { isPublished },
      });
      if (editingId === post.id) {
        setForm((prev) => ({ ...prev, isPublished }));
      }
      setPublishConfirm(null);
      setViewMode('active');
      setSuccessMessage(
        isPublished ? t('latestNewsRestoredSuccess') : t('latestNewsArchivedSuccess'),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('latestNewsSaveFailed'));
    }
  };

  const requestTogglePublished = (post: BlogPostDto, nextIsPublished: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPublishConfirm({ post, nextIsPublished });
  };

  const publishConfirmTitle = publishConfirm
    ? isHy
      ? publishConfirm.post.titleHy
      : publishConfirm.post.titleEn
    : '';
  const isPublishingConfirm = publishConfirm?.nextIsPublished === true;

  const dismissSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return (
    <div className="space-y-6 tablet:space-y-8">
      {successMessage ? (
        <AutoDismissToast
          key={successMessage}
          message={successMessage}
          variant="success"
          position="center"
          durationMs={2500}
          onDismiss={dismissSuccessMessage}
        />
      ) : null}

      <LatestNewsPostsSection
        posts={visiblePosts}
        isLoading={isLoading}
        isPending={isPending}
        isHy={isHy}
        selectedId={isFormOpen ? editingId : null}
        viewMode={viewMode}
        archiveCount={archivedPosts.length}
        title={viewMode === 'archive' ? t('latestNewsArchiveTitle') : t('latestNewsTitle')}
        description={
          viewMode === 'archive'
            ? t('latestNewsArchiveDescription')
            : t('latestNewsDescription')
        }
        loadingLabel={t('loading')}
        emptyLabel={
          viewMode === 'archive' ? t('latestNewsArchiveEmpty') : t('latestNewsEmpty')
        }
        draftLabel={t('latestNewsArchivedBadge')}
        publishedLabel={t('latestNewsPublished')}
        editHintLabel={t('latestNewsEdit')}
        removeLabel={t('remove')}
        createLabel={t('latestNewsCreatePost')}
        archiveLabel={t('latestNewsArchive')}
        backToActiveLabel={t('latestNewsBackToActive')}
        onCreate={handleCreate}
        onSelect={handleEdit}
        onDelete={(post) => void handleDelete(post)}
        onTogglePublished={requestTogglePublished}
        onViewModeChange={setViewMode}
      />

      <LatestNewsPublishConfirmDialog
        open={publishConfirm != null}
        isPublishing={isPublishingConfirm}
        isPending={updateMutation.isPending}
        title={
          isPublishingConfirm
            ? t('latestNewsPublishConfirmTitle')
            : t('latestNewsUnpublishConfirmTitle')
        }
        description={
          isPublishingConfirm
            ? t('latestNewsPublishConfirmDescription', { title: publishConfirmTitle })
            : t('latestNewsUnpublishConfirmDescription', { title: publishConfirmTitle })
        }
        confirmLabel={
          isPublishingConfirm
            ? t('latestNewsPublishConfirmAction')
            : t('latestNewsUnpublishConfirmAction')
        }
        cancelLabel={tCommon('cancel')}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) setPublishConfirm(null);
        }}
        onConfirm={() => {
          if (!publishConfirm) return;
          void handleTogglePublished(publishConfirm.post, publishConfirm.nextIsPublished);
        }}
      />

      <LatestNewsFormSheet
        open={isFormOpen}
        editingId={editingId}
        form={form}
        imageFile={imageFile}
        currentImageUrl={editingPost ? getBlogPostCoverUrl(editingPost) : null}
        isPending={isPending}
        errorMessage={errorMessage}
        labels={{
          createTitle: t('latestNewsCreatePost'),
          editTitle: t('latestNewsEditPost'),
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
          createAction: t('latestNewsCreatePost'),
          saveAction: t('saveChanges'),
          saving: t('saving'),
        }}
        fileInputRef={fileInputRef}
        onChange={setForm}
        onFileSelect={handleFileSelect}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        onSave={() => void handleSave()}
      />
    </div>
  );
}
