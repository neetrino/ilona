import { cn } from '@/shared/lib/utils';

interface SaveMessagesProps {
  saveMessages: { type: 'success' | 'error'; message: string } | null;
}

export function SaveMessages({ saveMessages }: SaveMessagesProps) {
  if (!saveMessages) return null;

  return (
    <div
      className={cn(
        'rounded-lg px-4 py-3 text-sm font-medium',
        saveMessages.type === 'success'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      )}
    >
      {saveMessages.message}
    </div>
  );
}




