import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

type PublicAssetImageProps = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  onError?: ImgHTMLAttributes<HTMLImageElement>['onError'];
};

/** Local /public assets (SVG or raster) — avoids next/image SVG restrictions */
export function PublicAssetImage({
  src,
  alt = '',
  width,
  height,
  className,
  fill,
  priority,
  onError,
}: PublicAssetImageProps) {
  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        onError={onError}
        className={cn('absolute inset-0 h-full w-full', className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      onError={onError}
      className={className}
    />
  );
}
