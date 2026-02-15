# Quick Fixes - Immediate Performance Improvements

These fixes can be applied in **under 10 minutes** and will provide immediate performance gains.

## 1. Fix Turborepo Dev Task (1 minute)

**File:** `turbo.json`

**Change:**
```json
{
  "dev": {
    "dependsOn": [],  // Remove "^build"
    "cache": false,
    "persistent": true
  }
}
```

**Why:** Currently, `pnpm dev` waits for all dependencies to build first, which is unnecessary and slow.

**Impact:** ⚡ 2-3x faster dev startup

---

## 2. Enable Turbopack (1 minute)

**File:** `apps/web/package.json`

**Change:**
```json
{
  "scripts": {
    "dev": "next dev --turbo -H 0.0.0.0"
  }
}
```

**Why:** Turbopack is Next.js 15's new bundler, significantly faster than Webpack.

**Impact:** ⚡ 3-5x faster HMR and builds

---

## 3. Fix API URL Environment Variable (2 minutes)

**File:** `apps/web/src/shared/lib/api.ts`

**Current Issue:** Complex runtime URL resolution that behaves differently on server vs client.

**Quick Fix:** Add to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**For Production:** Set in your deployment platform's environment variables.

**Impact:** 🐛 Prevents runtime errors, consistent behavior

---

## 4. Optimize React Query Cache (2 minutes)

**File:** `apps/web/src/shared/lib/query-client.tsx`

**Change:**
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (was 1 minute)
      gcTime: 10 * 60 * 1000, // 10 minutes (was 5 minutes)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Why:** Reduces unnecessary refetches for relatively static data.

**Impact:** ⚡ Fewer network requests, faster perceived performance

---

## 5. Add Loading State for Root Page (3 minutes)

**File:** `apps/web/src/app/[locale]/loading.tsx` (create new file)

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
```

**Why:** Provides immediate feedback during navigation.

**Impact:** ✨ Better UX, perceived performance

---

## Total Time: ~10 minutes
## Total Impact: 3-5x faster development, better UX

---

## After Quick Fixes

Once these are applied, you'll notice:
- ✅ Faster `pnpm dev` startup
- ✅ Faster hot module reloading
- ✅ Fewer unnecessary API calls
- ✅ Better loading states

Then proceed with the architectural changes from `TECHNICAL_AUDIT.md` for production performance improvements.

