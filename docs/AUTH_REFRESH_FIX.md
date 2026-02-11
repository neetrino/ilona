# Authentication Refresh Token Fix

## Problem Summary

After users stayed on the website for a long time (15+ minutes), API requests started returning `401 Unauthorized` errors. This was caused by:

1. **Access token expiration**: JWT access tokens expire after 15 minutes (configured in `JWT_ACCESS_EXPIRATION`)
2. **No proactive refresh**: The system only attempted refresh after receiving a 401 error
3. **Auto-logout on refresh failure**: When refresh failed, users were automatically logged out
4. **Concurrency issues**: Multiple simultaneous requests could trigger multiple refresh attempts
5. **No request queue**: Requests made during refresh were not queued and replayed

## Solution Overview

Implemented a robust silent re-authentication flow with the following features:

### ✅ Key Features

1. **Silent Re-Auth**: Access token expires → 401 → automatic refresh → retry original request → user notices nothing
2. **Single-Flight Refresh**: Only ONE refresh request is sent even if multiple API calls get 401 simultaneously
3. **Request Queue**: Requests made during refresh are queued and automatically replayed after refresh completes
4. **Proactive Refresh**: If access token expires within 60 seconds, refresh before sending the request
5. **No Auto-Logout**: When refresh fails, show a non-blocking "Session Expired" banner instead of forcing logout
6. **Exponential Backoff**: Network errors (not 401) are retried with exponential backoff (100ms, 200ms, 400ms, max 2000ms)
7. **Infinite Loop Prevention**: If refresh endpoint returns 401/403, don't retry forever

## Files Changed

### 1. `apps/web/src/shared/lib/jwt-utils.ts` (NEW)
- JWT token decoding utilities
- Token expiration checking
- Proactive refresh helpers (`expiresWithin`)

### 2. `apps/web/src/shared/lib/api.ts` (MAJOR UPDATE)
**Key Changes:**
- Added JWT expiration checking before requests
- Implemented request queue for concurrent requests during refresh
- Single-flight refresh pattern (all requests wait for same refresh)
- Proactive refresh (if token expires in < 60s)
- Exponential backoff for network errors
- Session expired callback instead of auto-logout
- `resetRefreshFailed()` method to reset state after login

**New Methods:**
- `setSessionExpiredCallback()`: Set callback for session expired (non-blocking)
- `resetRefreshFailed()`: Reset refresh failed state after successful login
- `processRequestQueue()`: Process queued requests after refresh

### 3. `apps/web/src/features/auth/store/auth.store.ts` (UPDATE)
**Key Changes:**
- Added `sessionExpired` state (non-blocking)
- `refreshToken()` no longer auto-logs out on failure
- Sets `sessionExpired: true` instead of calling `logout()`
- New actions: `setSessionExpired()`, `clearSessionExpired()`
- Updated `login()` to reset refresh failed state

### 4. `apps/web/src/shared/components/SessionExpiredBanner.tsx` (NEW)
- Non-blocking banner notification when session expires
- Auto-dismisses after 10 seconds
- "Log In" button to navigate to login page
- "Dismiss" button to close the banner

### 5. `apps/web/src/shared/lib/query-client.tsx` (UPDATE)
- Added `<SessionExpiredBanner />` component to display globally

## How It Works

### Flow Diagram

```
User Request → Check Token Expiry
    ↓
Expires in < 60s? → YES → Proactive Refresh → Wait → Continue
    ↓ NO
Send Request
    ↓
401 Response?
    ↓ YES
Check if already refreshing
    ↓
Already refreshing? → YES → Queue Request → Wait → Replay after refresh
    ↓ NO
Start Refresh (Single-Flight)
    ↓
Refresh Success? → YES → Replay Queued Requests → Continue
    ↓ NO
Set sessionExpired = true → Show Banner → Reject Requests
```

### Single-Flight Pattern

When multiple requests get 401 simultaneously:
1. First request starts refresh, sets `isRefreshing = true`
2. Other requests see `isRefreshing = true` and queue themselves
3. All requests wait for the same refresh promise
4. After refresh completes, all queued requests are replayed with new token

### Proactive Refresh

Before sending any request:
1. Check if access token expires within 60 seconds
2. If yes, refresh proactively (if not already refreshing)
3. Continue with the request using fresh token

## Backend Refresh Endpoint

**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Error Responses**:
- `401 Unauthorized`: Refresh token is invalid/expired
- `403 Forbidden`: Refresh token is forbidden

## CORS Configuration

CORS is already configured correctly in `apps/api/src/main.ts`:
- `credentials: true` - Allows cookies to be sent
- Development: `origin: true` (allows all origins)
- Production: `origin: corsOrigin` (specific origins)

**Note**: Currently, refresh tokens are sent in the request body. If you want to migrate to httpOnly cookies:

1. Update backend refresh endpoint to set cookie:
```typescript
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

2. Update frontend to not send refreshToken in body
3. Update CORS to include `sameSite` and `secure` flags

## Testing Checklist

### Manual Testing

1. **Long Idle Time Test**
   - [ ] Log in to the application
   - [ ] Wait 16+ minutes (longer than access token expiry)
   - [ ] Make an API request (e.g., navigate to a page that fetches data)
   - [ ] Verify: Request succeeds without user noticing (silent refresh)

2. **Concurrent Requests Test**
   - [ ] Log in and wait for token to expire
   - [ ] Open browser DevTools → Network tab
   - [ ] Trigger multiple API requests simultaneously (e.g., navigate to dashboard with multiple data fetches)
   - [ ] Verify: Only ONE refresh request is sent
   - [ ] Verify: All original requests succeed after refresh

3. **Proactive Refresh Test**
   - [ ] Log in
   - [ ] Wait until token expires in < 60 seconds
   - [ ] Make an API request
   - [ ] Verify: Refresh happens BEFORE the request (check Network tab)
   - [ ] Verify: Request succeeds with fresh token

4. **Session Expired Test**
   - [ ] Log in
   - [ ] Manually delete refresh token from localStorage (or wait for it to expire)
   - [ ] Make an API request
   - [ ] Verify: "Session Expired" banner appears (non-blocking)
   - [ ] Verify: User is NOT automatically logged out
   - [ ] Verify: User can dismiss banner or click "Log In"

5. **Network Error Test**
   - [ ] Log in
   - [ ] Disconnect network temporarily
   - [ ] Make an API request
   - [ ] Verify: Request retries with exponential backoff (check Network tab)
   - [ ] Reconnect network
   - [ ] Verify: Request eventually succeeds

6. **Refresh Endpoint 401 Test**
   - [ ] Log in
   - [ ] Manually corrupt refresh token in localStorage
   - [ ] Make an API request
   - [ ] Verify: Refresh endpoint returns 401
   - [ ] Verify: No infinite retry loop
   - [ ] Verify: Session expired banner appears

### Automated Testing (Future)

Consider adding unit tests for:
- JWT expiration checking
- Request queue logic
- Single-flight refresh pattern
- Exponential backoff calculation

## Migration Notes

### Token Storage

**Current**: Both access and refresh tokens stored in localStorage (via Zustand persist)

**Recommended (Future)**: 
- Access token: Memory only (already implemented via Zustand store)
- Refresh token: httpOnly cookie (requires backend changes)

**Migration Steps** (if desired):
1. Update backend login endpoint to set refresh token as httpOnly cookie
2. Update backend refresh endpoint to read from cookie instead of body
3. Update frontend to not send refreshToken in request body
4. Update frontend to not store refreshToken in localStorage
5. Update CORS settings for cookie support

## Why This Fixes the Issue

### Before
- Access token expires after 15 minutes
- User makes request → 401 → refresh attempt
- If refresh fails → auto-logout → user kicked out
- Concurrent requests → multiple refresh attempts → race conditions

### After
- Access token expires → proactive refresh (if < 60s) OR refresh on 401
- Single refresh for all concurrent requests
- Failed refresh → session expired banner (non-blocking)
- User can continue working and manually log in when ready

## Configuration

### Environment Variables

**Backend** (`apps/api/.env`):
```env
JWT_ACCESS_EXPIRATION=15m      # Access token lifetime
JWT_REFRESH_EXPIRATION=7d      # Refresh token lifetime
CORS_ORIGIN=http://localhost:3000  # Frontend origin (production)
```

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api  # Optional, auto-detected
```

## Troubleshooting

### Issue: Still getting 401 errors
- Check that `initializeApiClient()` is called in `QueryProvider`
- Verify tokens are being stored correctly in Zustand store
- Check browser console for refresh errors

### Issue: Infinite refresh loop
- Verify `skipAuthRefresh: true` is set for `/auth/refresh` endpoint
- Check that refresh endpoint doesn't return 401 (would trigger loop)

### Issue: Session expired banner not showing
- Verify `SessionExpiredBanner` is added to `QueryProvider`
- Check that `setSessionExpiredCallback` is called in `initializeApiClient()`

### Issue: Requests not queuing during refresh
- Check that `isRefreshing` flag is set correctly
- Verify request queue is processed after refresh completes

## Performance Impact

- **Minimal**: Proactive refresh only checks token expiry (fast JWT decode)
- **Network**: One additional refresh request per 15 minutes (if proactive)
- **Memory**: Request queue is cleared after processing (no memory leak)

## Security Considerations

1. ✅ Access tokens expire quickly (15 minutes)
2. ✅ Refresh tokens expire after 7 days
3. ✅ Tokens stored in memory (access) and localStorage (refresh) - consider httpOnly cookies for refresh
4. ✅ No tokens in URL or logs
5. ✅ CORS properly configured with credentials

## Future Improvements

1. **httpOnly Cookies**: Migrate refresh token to httpOnly cookie (more secure)
2. **Token Rotation**: Implement refresh token rotation on each refresh
3. **Device Tracking**: Track devices and allow revoking refresh tokens
4. **Rate Limiting**: Add rate limiting to refresh endpoint
5. **Monitoring**: Add metrics for refresh success/failure rates

