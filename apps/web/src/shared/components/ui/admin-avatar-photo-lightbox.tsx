'use client';

import { AnimatePresence, motion } from 'framer-motion';

export interface AdminAvatarPhotoLightboxProps {
  open: boolean;
  imageUrl: string | null | undefined;
  imageAlt: string;
  /** `role="dialog"` aria-label (e.g. view full photo). */
  ariaLabel: string;
  closeAriaLabel: string;
  onClose: () => void;
}

/**
 * Full-screen profile photo preview used in Admin Teacher/Student detail modals.
 * Close: overlay click, ✕, or Escape (typically via parent `AdminDetailModal` `onEscapeKey`).
 */
export function AdminAvatarPhotoLightbox({
  open,
  imageUrl,
  imageAlt,
  ariaLabel,
  closeAriaLabel,
  onClose,
}: AdminAvatarPhotoLightboxProps) {
  const show = Boolean(open && imageUrl);

  return (
    <AnimatePresence mode="sync">
      {show && imageUrl ? (
        <motion.div
          key={imageUrl}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 z-[61] rounded-lg p-2 text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={closeAriaLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: 0.05 }}
          >
            ✕
          </motion.button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={imageUrl}
            alt={imageAlt}
            className="max-w-[min(92vw,1200px)] max-h-[min(88vh,900px)] w-auto h-auto object-contain rounded-lg shadow-2xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
