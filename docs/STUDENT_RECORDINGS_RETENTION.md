# Student Recordings – Permanent Retention

This document describes how **Student → Recordings** voice files are stored and that they **do not auto-expire**.

## Summary

- **No time-based expiration logic was found** in the codebase. Voice recordings in Student Recordings are already stored for indefinite retention.
- **No changes were made to remove expiration**, because none existed. Comments and this doc were added so future changes do not introduce TTL or auto-deletion.

## Where Expiration Logic Was Checked (None Found)

| Area | Location | Result |
|------|----------|--------|
| **Database** | `packages/database/prisma/schema.prisma` – `Message` model | No `expiresAt` or TTL field. Recordings are VOICE messages with `fileUrl`. |
| **API – list** | `apps/api/src/modules/chat/message.service.ts` – `getStudentVoiceToTeacherRecordings()` | No date filter; returns all voice-to-teacher messages. |
| **API – delete** | `message.service.ts` – `deleteMessage()` | Manual only (user deletes own message); no scheduled/age-based delete. |
| **Storage upload** | `apps/api/src/modules/storage/storage.service.ts` – `upload()`, `uploadChatFile()` | Standard `PutObjectCommand`; no lifecycle or expiration metadata. |
| **Cron/cleanup** | `apps/api/package.json`, codebase grep | No cleanup/cron scripts that delete recordings or old messages. |
| **R2 lifecycle** | Repo (no Terraform/CF config in repo) | No code-defined bucket lifecycle; ensure R2 dashboard has **no** lifecycle rule that auto-deletes `chat/` objects. |

## Current Behavior (Unchanged)

1. **Upload**  
   Voice files are uploaded via `POST /storage/chat` → `uploadChatFile()` → `upload(..., 'chat')`. Objects are stored under the `chat/` prefix in R2 or local `uploads/chat/` with no expiration.

2. **Playback**  
   The Student Recordings page uses `getStudentVoiceToTeacherRecordings`; the UI plays audio via `VoiceMessagePlayer`, which uses `getProxiedFileUrl()`. Playback goes through the API storage proxy (`GET /storage/proxy?url=...`), which reads the file with `storageService.getFile(key)`. So access is always from the stored object; no long-lived signed URL is required for the file to “persist.”

3. **Manual delete**  
   Deleting a message (student or admin) calls `deleteMessage()`, which removes the DB row and deletes the file from storage via `storageService.delete(key)`.

## What Was Added

- **Comments in code**  
  - In `message.service.ts`: above `getStudentVoiceToTeacherRecordings()`, a RETENTION comment stating that Student Recordings have no expiration and must not get TTL or cleanup.  
  - In `storage.service.ts`: above `uploadChatFile()`, a RETENTION comment stating that chat files (including Student Recordings) are stored permanently and must not get lifecycle/expiration.

- **This document**  
  Summary of where expiration was checked, that none was found, and how to keep retention permanent.

## Verification Checklist (for deployments)

- [ ] **Storage bucket (R2):** No lifecycle rule that deletes or transitions objects in the `chat/` prefix (or the bucket used for chat). If a rule exists for other prefixes, ensure `chat/` is excluded.
- [ ] **Database:** No `expiresAt` (or similar) on the Message model; no scheduled job that deletes messages by age.
- [ ] **Playback:** Upload a voice recording as a student, open Student → Recordings, confirm it appears and plays. After any period (e.g. past a previously suspected “expiration”), confirm it still appears and plays.
- [ ] **Manual delete:** Delete a recording from the UI and confirm the DB row and the file in storage are both removed.

## Backward Compatibility

- Existing recordings are unchanged; no migration or data change was required.
- Upload, playback, and manual delete behavior are unchanged; only comments and this doc were added.
