/** Extract storage object key from a message file URL (R2, local, or proxy). */
export function extractStorageKeyFromFileUrl(fileUrl: string): string | undefined {
  let key: string | undefined;

  try {
    const url = new URL(fileUrl);
    const pathname = url.pathname;
    if (pathname && pathname.length > 1) {
      key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
      if (key && !key.match(/^(chat|avatars|documents)\//)) {
        const match = fileUrl.match(/\/(chat|avatars|documents)(\/.*)?$/);
        if (match && match[0]) {
          key = match[0].startsWith('/') ? match[0].substring(1) : match[0];
        } else {
          key = undefined;
        }
      }
    }
  } catch {
    const match = fileUrl.match(/\/(chat|avatars|documents)(\/.*)?$/);
    if (match && match[0]) {
      key = match[0].startsWith('/') ? match[0].substring(1) : match[0];
    }
  }

  if (!key) {
    if (fileUrl.includes('/api/storage/file/')) {
      const parts = fileUrl.split('/api/storage/file/');
      if (parts.length > 1) {
        key = decodeURIComponent(parts[1]);
      }
    } else if (fileUrl.includes('/api/storage/proxy')) {
      try {
        const url = new URL(fileUrl);
        const urlParam = url.searchParams.get('url');
        if (urlParam) {
          const proxiedUrl = decodeURIComponent(urlParam);
          try {
            const proxiedUrlObj = new URL(proxiedUrl);
            const pathname = proxiedUrlObj.pathname;
            if (pathname && pathname.length > 1) {
              key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
            }
          } catch {
            const match = proxiedUrl.match(/\/(chat|avatars|documents)(\/.*)?$/);
            if (match && match[0]) {
              key = match[0].startsWith('/') ? match[0].substring(1) : match[0];
            }
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  return key;
}
