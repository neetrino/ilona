/** Generate UUID v4 for x-request-id (correlation with backend logs). */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Best-effort callsite hint from stack (dev tracer). Skips api-client and node_modules. */
export function getCallsiteHint(): string | undefined {
  try {
    const stack = new Error().stack;
    if (!stack) return undefined;
    const lines = stack.split('\n').slice(1);
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.includes('api-client') ||
        trimmed.includes('node_modules') ||
        trimmed.includes('at Object.')
      ) {
        continue;
      }
      const match = trimmed.match(/at\s+(.+?)\s+\((.+?)\)/) || trimmed.match(/at\s+(.+)/);
      if (match) return match[1]?.trim().slice(0, 120);
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function getBackoffDelay(retryCount: number): number {
  return Math.min(100 * 2 ** retryCount, 2000);
}
