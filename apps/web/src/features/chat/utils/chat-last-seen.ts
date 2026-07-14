export type ChatLastSeenTranslator = (
  key:
    | 'online'
    | 'lastSeenJustNow'
    | 'lastSeenMinute'
    | 'lastSeenMinutes'
    | 'lastSeenHour'
    | 'lastSeenHours'
    | 'lastSeenDay'
    | 'lastSeenDays'
    | 'lastSeenRecently',
  values?: { count: number },
) => string;

export function formatChatLastSeen(
  isOnline: boolean,
  lastSeenAt: string | null | undefined,
  t: ChatLastSeenTranslator,
): string {
  if (isOnline) return t('online');

  if (!lastSeenAt) return t('lastSeenRecently');

  const seenMs = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seenMs)) return t('lastSeenRecently');

  const diffMs = Math.max(0, Date.now() - seenMs);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t('lastSeenJustNow');
  if (minutes === 1) return t('lastSeenMinute');
  if (minutes < 60) return t('lastSeenMinutes', { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return t('lastSeenHour');
  if (hours < 24) return t('lastSeenHours', { count: hours });

  const days = Math.floor(hours / 24);
  if (days === 1) return t('lastSeenDay');
  return t('lastSeenDays', { count: days });
}
