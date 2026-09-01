'use client';

import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { getFullApiUrl } from '@/shared/lib/api-url-utils';

type LatestNewsImageFieldProps = {
  label: string;
  formatsHint: string;
  chooseLabel: string;
  changeLabel: string;
  keepCurrentLabel: string;
  fileName: string | null;
  currentImageUrl: string | null;
  imageFile: File | null;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export function LatestNewsImageField({
  label,
  formatsHint,
  chooseLabel,
  changeLabel,
  keepCurrentLabel,
  fileName,
  currentImageUrl,
  imageFile,
  disabled = false,
  onFileSelect,
  fileInputRef,
}: LatestNewsImageFieldProps) {
  const objectUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewSrc = objectUrl ?? (currentImageUrl ? getFullApiUrl(currentImageUrl) : null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[#3b3b40]">{label}</label>

      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-dashed border-[rgba(16,16,163,0.25)] bg-[#f7f8fc]',
          previewSrc ? 'border-solid border-[rgba(14,14,16,0.07)]' : '',
        )}
      >
        {previewSrc ? (
          <>
            <div className="relative aspect-[16/10] w-full bg-[#ecf0f7]">
              <Image
                src={previewSrc}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                {fileName ? (
                  <p className="truncate text-sm font-medium text-[#1010a3]">{fileName}</p>
                ) : (
                  <p className="text-sm text-[#8b8b90]">{keepCurrentLabel}</p>
                )}
                <p className="mt-0.5 text-xs text-[#8b8b90]">{formatsHint}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-[12px]"
              >
                {changeLabel}
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="relative flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 px-6 text-center transition-colors hover:bg-[#f0f0fc] disabled:opacity-60"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#1010a3] shadow-sm">
              <ImagePlus className="size-6" strokeWidth={1.75} />
            </span>
            <span className="text-sm font-medium text-[#3b3b40]">{chooseLabel}</span>
            <span className="max-w-xs text-xs text-[#8b8b90]">{formatsHint}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
