# Performance Analysis & Issues Report

**Date:** Generated on analysis  
**Project:** Ilona English Center - Gugo  
**Status:** Analysis Complete - No Changes Made

---

## Executive Summary

This document outlines performance issues, potential bugs, and optimization opportunities identified throughout the codebase. The analysis focused on:
- Chat functionality performance
- React component re-rendering issues
- WebSocket/Socket.IO connection management
- React Query configuration
- Memory leaks and cleanup issues
- Code quality issues

---

## 🔴 Critical Issues

### 1. **Console.log in Production Code**
**Location:** `apps/web/src/app/[locale]/(teacher)/teacher/calendar/page.tsx:322`

**Issue:**
```typescript
console.log("hello");
```
This debug statement is left in production code and will execute on every render of the calendar page.

**Impact:** 
- Unnecessary console output
- Potential performance impact if console is slow
- Code quality issue

**Fix:** Remove the console.log statement.

---

### 2. **Socket Status Polling (1 Second Interval)**
**Location:** `apps/web/src/features/chat/hooks/useSocket.ts:411-417`

**Issue:**
```typescript
export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(isSocketConnected());
    }, 1000); // Polls every second!

    return () => clearInterval(interval);
  }, []);

  return isConnected;
}
```

**Impact:**
- Causes state update every second, triggering re-renders
- Unnecessary polling when socket already has connection/disconnection events
- Wastes CPU cycles and battery on mobile devices

**Fix:** 
- Remove this hook if not used, or
- Use socket event listeners instead of polling
- If polling is necessary, increase interval to 5-10 seconds

---

### 3. **Socket Reconnection on Token Change**
**Location:** `apps/web/src/features/chat/hooks/useSocket.ts:45-87`

**Issue:**
The `useEffect` that initializes the socket has `token` and `queryClient` in dependencies. Every time the token changes (even if it's just a refresh), the socket disconnects and reconnects.

```typescript
useEffect(() => {
  if (!token) return;
  // ... socket initialization
  return () => {
    disconnectSocket(); // Disconnects on every token change
  };
}, [token, refreshTokenFn, queryClient]); // queryClient shouldn't be here
```

**Impact:**
- Unnecessary disconnections/reconnections
- Message loss during reconnection
- Poor user experience
- Increased server load

**Fix:**
- Remove `queryClient` from dependencies (it's stable)
- Only reconnect if token actually changed (not just refreshed)
- Use socket.io's built-in reconnection instead of manual disconnect

---

### 4. **Missing Event Listener Cleanup**
**Location:** `apps/web/src/app/[locale]/(teacher)/teacher/students/[id]/page.tsx:37-48`

**Issue:**
The visibility change event listener cleanup is incomplete:

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      refetch();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [refetch]); // refetch changes on every render!
```

**Impact:**
- Event listener may not be properly removed
- Memory leak potential
- Multiple listeners may accumulate

**Fix:**
- Use `useCallback` for `refetch` or remove it from dependencies
- Ensure cleanup function matches the exact handler reference

---

## 🟡 High Priority Issues

### 5. **Multiple useEffect Hooks in ChatWindow**
**Location:** `apps/web/src/features/chat/components/ChatWindow.tsx`

**Issue:**
The component has 4 separate `useEffect` hooks:
- Line 334: Scroll to bottom on messages change
- Line 341: Mark as read when chat opens
- Line 364: Reset input when chat changes
- Line 376: Save draft on unmount

**Impact:**
- Multiple effect runs on every chat change
- Potential race conditions
- Unnecessary re-renders

**Fix:**
- Consider combining related effects
- Use `useMemo` for derived values
- Optimize dependency arrays

---

### 6. **Mark as Read Potential Infinite Loop**
**Location:** `apps/web/src/features/chat/components/ChatWindow.tsx:341-360`

**Issue:**
The mark-as-read effect depends on `markAsRead` function, which is a `useCallback` that depends on `queryClient`. This could cause re-renders.

```typescript
useEffect(() => {
  if (chat.id && chat.id !== lastMarkedConversationIdRef.current && !isLoading) {
    lastMarkedConversationIdRef.current = chat.id;
    markAsRead(chat.id).catch((error) => {
      console.error('[ChatWindow] Failed to mark as read:', error);
      lastMarkedConversationIdRef.current = null; // Resets on error
    });
  }
}, [chat.id, isLoading, markAsRead]); // markAsRead changes when queryClient changes
```

**Impact:**
- Potential infinite loop if error occurs
- Unnecessary mark-as-read calls
- Server load

**Fix:**
- Remove `markAsRead` from dependencies (use ref pattern)
- Add debouncing to prevent rapid calls
- Better error handling to prevent reset loop

---

### 7. **Excessive Console Logging**
**Location:** Multiple files throughout the codebase

**Issue:**
Found 50+ console.log/warn/error statements in production code:
- `apps/web/src/shared/lib/api.ts` - Multiple logs for every API request
- `apps/web/src/features/chat/lib/socket.ts` - Connection logs
- Various components with error logging

**Impact:**
- Performance impact in production (console is slow)
- Security risk (may leak sensitive data)
- Code quality issue

**Fix:**
- Use a logging library (e.g., `winston`, `pino`)
- Implement log levels (dev vs production)
- Remove or conditionally enable debug logs
- Use proper error tracking (Sentry, etc.)

---

### 8. **Socket Event Listener Cleanup**
**Location:** `apps/web/src/features/chat/hooks/useSocket.ts:90-280`

**Issue:**
The socket event subscription effect has `token` and `queryClient` in dependencies, causing re-subscription on every change:

```typescript
useEffect(() => {
  if (!token) return;
  // ... subscribe to events
  return () => {
    unsubscribers.forEach((unsub) => unsub());
    disconnectSocket(); // Disconnects socket even if just token refreshed
  };
}, [token, queryClient]); // Should only depend on token
```

**Impact:**
- Event listeners re-subscribed unnecessarily
- Socket disconnected when it shouldn't be
- Message loss

**Fix:**
- Remove `queryClient` from dependencies
- Only re-subscribe if socket instance changes, not token

---

### 9. **ChatContainer Complex useEffect Dependencies**
**Location:** `apps/web/src/features/chat/components/ChatContainer.tsx:80-164`

**Issue:**
Large useEffect with many dependencies that could cause frequent re-runs:

```typescript
useEffect(() => {
  // ... complex logic
}, [chats, isLoadingChats, isLoadingTeachers, teachers, searchParams, setActiveChat, setMobileListVisible, router, pathname, isStudent, createDirectChat, conversationIdFromUrl]);
```

**Impact:**
- Effect runs on every dependency change
- Potential infinite loops
- Unnecessary API calls

**Fix:**
- Break into smaller, focused effects
- Use refs for stable values
- Memoize callbacks

---

## 🟢 Medium Priority Issues

### 10. **React Query Configuration Inconsistencies**
**Location:** `apps/web/src/shared/lib/query-client.tsx` vs individual hooks

**Issue:**
- Global config: `staleTime: 5 * 60 * 1000` (5 minutes)
- Some hooks override: `staleTime: 60 * 1000` (1 minute) - e.g., `useAdminStudents`
- `useTeacherGroups`: `staleTime: 0` (always stale)

**Impact:**
- Inconsistent caching behavior
- Unnecessary refetches
- Confusing for developers

**Fix:**
- Standardize staleTime values
- Document why certain queries need different values
- Use consistent naming

---

### 11. **Voice Recorder Interval Cleanup**
**Location:** `apps/web/src/features/chat/components/VoiceRecorder.tsx:326-334`

**Issue:**
Duration interval is set but cleanup depends on `cleanup` callback which may change:

```typescript
durationIntervalRef.current = setInterval(() => {
  const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
  setDurationSec(elapsed);
  if (elapsed >= 300) {
    stopRecording();
  }
}, 1000);
```

**Impact:**
- Interval may not be cleared properly
- Memory leak potential

**Fix:**
- Ensure interval is always cleared in cleanup
- Use refs for interval ID

---

### 12. **Scroll to Bottom on Every Message Change**
**Location:** `apps/web/src/features/chat/components/ChatWindow.tsx:334-336`

**Issue:**
```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages.length]);
```

**Impact:**
- Smooth scroll on every message (even when loading old messages)
- Poor UX when user is reading old messages
- Performance impact

**Fix:**
- Only scroll if user is near bottom
- Don't scroll when loading older messages
- Use `scrollIntoView` with `block: 'nearest'` for better performance

---

### 13. **Vocabulary Modal Text Issue**
**Location:** `apps/web/src/features/chat/components/ChatWindow.tsx:202`

**Issue:**
```typescript
<h3 className="text-lg font-semibold text-white flex items-center gap-2">
  <span>📚</span>
  Send Vocabulary (Բdelays)  // Typo: "Բdelays" should be "Բառեր" or similar
</h3>
```

**Impact:**
- UI/UX issue (typo in UI)
- Not a performance issue but affects user experience

**Fix:**
- Correct the text

---

## 🔵 Low Priority / Code Quality Issues

### 14. **Missing Type Safety in Some Places**
**Location:** Various files

**Issue:**
- Use of `any` types in socket event handlers
- Missing return types in some functions
- Loose typing in some API responses

**Impact:**
- Potential runtime errors
- Reduced IDE support
- Harder to maintain

**Fix:**
- Add proper TypeScript types
- Enable strict mode
- Use type guards

---

### 15. **Inconsistent Error Handling**
**Location:** Multiple files

**Issue:**
- Some errors are logged to console
- Some errors show alerts
- Some errors are silently ignored
- No centralized error handling

**Impact:**
- Poor user experience
- Difficult to debug
- Inconsistent behavior

**Fix:**
- Implement error boundary
- Use toast notifications consistently
- Centralize error handling

---

### 16. **Potential N+1 Query Issues**
**Location:** Backend (referenced in PROJECT-AUDIT.md)

**Issue:**
- Students list may cause N+1 queries for related data
- Prisma includes may not batch properly

**Impact:**
- Slow database queries
- High database load
- Poor performance with many records

**Fix:**
- Review Prisma queries
- Use `include` strategically
- Consider data loaders
- Add database indexes

---

## 📊 Performance Metrics to Monitor

1. **Component Re-renders**
   - Use React DevTools Profiler
   - Monitor ChatWindow re-renders
   - Check Calendar page renders

2. **Network Requests**
   - Monitor duplicate API calls
   - Check WebSocket reconnections
   - Track unnecessary refetches

3. **Memory Usage**
   - Monitor for memory leaks
   - Check event listener cleanup
   - Verify interval/timeout cleanup

4. **Bundle Size**
   - Check for large dependencies
   - Monitor code splitting
   - Verify tree shaking

---

## 🛠️ Recommended Fix Priority

### Phase 1 (Immediate - Critical)
1. Remove console.log from calendar page
2. Fix socket status polling
3. Fix socket reconnection logic
4. Fix missing event listener cleanup

### Phase 2 (High Priority)
5. Optimize ChatWindow useEffects
6. Fix mark-as-read infinite loop potential
7. Reduce console logging
8. Fix socket event subscription

### Phase 3 (Medium Priority)
9. Standardize React Query config
10. Fix scroll behavior in chat
11. Improve error handling
12. Fix vocabulary modal typo

### Phase 4 (Low Priority / Technical Debt)
13. Add proper TypeScript types
14. Implement error boundaries
15. Review and fix N+1 queries
16. Add performance monitoring

---

## 🔍 Additional Observations

### Dependencies Check
- All required dependencies appear to be installed
- No obvious missing packages
- Version conflicts not detected

### Build Configuration
- Next.js 15.1.0 (latest)
- React 19.0.0 (latest)
- TypeScript 5.5.4 (latest)
- All dependencies up to date

### Code Structure
- Well-organized feature-based structure
- Good separation of concerns
- Consistent naming conventions

---

## 📝 Notes

- This analysis did not make any code changes
- All issues are documented for step-by-step fixing
- Some issues may require testing to confirm impact
- Performance issues may be more noticeable under load

---

## 🎯 Next Steps

1. Review this document with the team
2. Prioritize fixes based on user impact
3. Create tickets for each issue
4. Fix issues one by one, testing after each fix
5. Monitor performance metrics after fixes
6. Update this document as issues are resolved

---

**End of Analysis Report**

