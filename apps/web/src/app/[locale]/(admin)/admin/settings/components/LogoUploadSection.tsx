'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui';
import { useLogo, useUploadLogo, useDeleteLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { getErrorMessage } from '@/shared/lib/api';

export function LogoUploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasLocalPreviewRef = useRef(false); // Track if we have a local file preview
  
  const { data: logoData, isLoading: isLoadingLogo } = useLogo();
  const uploadLogo = useUploadLogo();
  const deleteLogo = useDeleteLogo();

  const currentLogoUrl = getFullApiUrl(logoData?.logoUrl) || null;

  // Set preview when logo data changes from query (but don't overwrite local preview during file selection)
  useEffect(() => {
    // Only update preview from query data if we don't have a local preview active
    // This prevents overwriting the preview while user is selecting a file
    if (!hasLocalPreviewRef.current) {
      if (currentLogoUrl) {
        setPreviewUrl(currentLogoUrl);
      } else {
        // If logo was deleted, clear preview
        setPreviewUrl(null);
      }
    }
  }, [currentLogoUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/svg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PNG, JPG, WEBP, and SVG images are allowed.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size too large. Please upload an image smaller than 5MB.');
      return;
    }

    // Create preview
    hasLocalPreviewRef.current = true; // Mark that we have a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadError(null);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError('Please select a file first.');
      return;
    }

    setUploadError(null);
    try {
      await uploadLogo.mutateAsync(file);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Clear local preview flag and let the query data (which was updated by the mutation) drive the display
      // The mutation already updated the query cache with the new logoUrl, so currentLogoUrl will update
      hasLocalPreviewRef.current = false;
      setPreviewUrl(null);
      // The useEffect will pick up the new currentLogoUrl from the query and set it as preview
    } catch (error: unknown) {
      setUploadError(getErrorMessage(error, 'Failed to upload logo. Please try again.'));
      // On error, keep the preview so user can try again (don't clear hasLocalPreviewRef)
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the logo? This will remove it for all users.')) {
      return;
    }

    setUploadError(null);
    try {
      await deleteLogo.mutateAsync();
      // Clear local preview flag since logo is deleted
      hasLocalPreviewRef.current = false;
      setPreviewUrl(null);
      // The useEffect will pick up the null currentLogoUrl and keep preview null
    } catch (error: unknown) {
      setUploadError(getErrorMessage(error, 'Failed to delete logo. Please try again.'));
    }
  };

  // Display priority: local preview (during file selection) > query data (persisted logo)
  // After successful upload, previewUrl is cleared, so it falls back to currentLogoUrl from query
  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Logo</h2>
      
      <div className="space-y-6">
        {/* Current Logo Preview */}
        {displayUrl && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Current Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                <img
                  src={displayUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                  onError={() => {
                    setPreviewUrl(null);
                  }}
                />
              </div>
              {currentLogoUrl && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleteLogo.isPending}
                >
                  {deleteLogo.isPending ? 'Deleting...' : 'Delete Logo'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {displayUrl ? 'Replace Logo' : 'Upload Logo'}
          </label>
          
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Choose File</span>
              </label>
              {fileInputRef.current?.files?.[0] && (
                <span className="ml-3 text-sm text-slate-600">
                  {fileInputRef.current.files[0].name}
                </span>
              )}
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {uploadError}
              </div>
            )}

            <div className="text-xs text-slate-500 space-y-1">
              <p>• Allowed formats: PNG, JPG, WEBP, SVG</p>
              <p>• Maximum file size: 5MB</p>
              <p>• The logo will be displayed in the sidebar for all users</p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!fileInputRef.current?.files?.[0] || uploadLogo.isPending || isLoadingLogo}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {uploadLogo.isPending ? 'Uploading...' : 'Upload Logo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

