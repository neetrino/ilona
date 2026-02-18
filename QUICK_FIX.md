# ⚡ Quick Fix for 500 Error

## The Problem
The database doesn't have the new columns (`absenceMarked`, `voiceSent`, `textSent`) yet, causing 500 errors.

## ✅ Solution - Apply Migration

### Option 1: Using Prisma db push (Easiest)

**Make sure your `.env.local` file has `DATABASE_URL` set, then run:**

```bash
# From root directory
pnpm db:push
```

This will:
- ✅ Apply schema changes to database
- ✅ Regenerate Prisma Client automatically

**Then restart your API server.**

---

### Option 2: Manual SQL (If Option 1 fails)

1. **Open your database client** (pgAdmin, DBeaver, or any PostgreSQL client)
2. **Connect to your database** using your `DATABASE_URL`
3. **Run this SQL:**

```sql
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "absenceMarked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "absenceMarkedAt" TIMESTAMP(3);
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "voiceSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "voiceSentAt" TIMESTAMP(3);
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "textSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "textSentAt" TIMESTAMP(3);
```

4. **Regenerate Prisma Client:**
```bash
pnpm db:generate
```

5. **Restart your API server**

---

### Option 3: Using psql command line

If you have `psql` installed:

```bash
# Get your DATABASE_URL from .env.local, then:
psql "YOUR_DATABASE_URL" -f packages/database/prisma/migrations/apply_lesson_obligations_manual.sql
```

Then:
```bash
pnpm db:generate
```

---

## After Migration

1. ✅ Migration applied
2. ✅ Prisma Client regenerated
3. ✅ API server restarted
4. ✅ 500 error should be gone!

---

## Still Having Issues?

Check:
- ✅ `.env.local` file exists and has `DATABASE_URL`
- ✅ Database connection is working
- ✅ You have permissions to alter the `lessons` table
- ✅ API server is restarted after migration












