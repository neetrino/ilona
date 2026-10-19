import { cn } from '@/shared/lib/utils';
import type { InboxCategory } from './notification-presentation';

const TONE: Record<InboxCategory, string> = {
  class: 'bg-[#1010a3]/10 text-[#1010a3]',
  duties: 'bg-amber-100 text-amber-800',
  finance: 'bg-emerald-100 text-emerald-800',
  risk: 'bg-rose-100 text-rose-800',
  message: 'bg-sky-100 text-sky-800',
  letter: 'bg-violet-100 text-violet-800',
};

export function NotificationInboxIcon({ category }: { category: InboxCategory }) {
  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
        TONE[category],
      )}
      aria-hidden
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {category === 'class' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z" />
        ) : category === 'duties' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : category === 'finance' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-2.2 0-4 1.3-4 3s1.8 3 4 3 4 1.3 4 3-1.8 3-4 3m0-12V5m0 14v-2" />
        ) : category === 'risk' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.3 4.3L2.8 19a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z" />
        ) : category === 'message' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8M8 14h5m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        )}
      </svg>
    </span>
  );
}
