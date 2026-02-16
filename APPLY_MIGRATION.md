# Apply Lesson Obligations Migration

## Problem
The database doesn't have the new columns yet, causing 500 errors. You need to apply the migration.

## ⚡ Quick Fix - Easiest Method

**Run this command from the root directory:**

```bash
pnpm --filter @ilona/database db:apply-obligations
```

This will:
1. ✅ Apply the migration to your database
2. 📝 Show you next steps

Then regenerate Prisma Client:
```bash
pnpm db:generate
```

And restart your API server.

## Alternative Methods (Choose One)

### Solution 1: Using Prisma db push (Easiest)

Make sure you have `DATABASE_URL` in your `.env.local` file, then run:

```bash
# From root directory
pnpm db:push

# This will:
# 1. Apply schema changes to database
# 2. Regenerate Prisma Client automatically
```

**Note:** If you get DIRECT_URL error, you can temporarily comment out `directUrl` in `schema.prisma` for this operation, or add a dummy DIRECT_URL to .env.local.

### Solution 2: Manual SQL (If Prisma fails)

1. Connect to your PostgreSQL database using any client (psql, pgAdmin, DBeaver, etc.)
2. Run the SQL from `packages/database/prisma/migrations/apply_lesson_obligations_manual.sql`

Or copy-paste this SQL:

```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'absenceMarked') THEN
        ALTER TABLE "lessons" ADD COLUMN "absenceMarked" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'absenceMarkedAt') THEN
        ALTER TABLE "lessons" ADD COLUMN "absenceMarkedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'voiceSent') THEN
        ALTER TABLE "lessons" ADD COLUMN "voiceSent" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'voiceSentAt') THEN
        ALTER TABLE "lessons" ADD COLUMN "voiceSentAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'textSent') THEN
        ALTER TABLE "lessons" ADD COLUMN "textSent" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'textSentAt') THEN
        ALTER TABLE "lessons" ADD COLUMN "textSentAt" TIMESTAMP(3);
    END IF;
END $$;
```

3. After applying SQL, regenerate Prisma Client:
```bash
# Stop your dev servers first!
pnpm db:generate
```

### Solution 3: Using Prisma Migrate

```bash
cd packages/database
# Make sure DIRECT_URL is set in .env.local
pnpm db:migrate:dev
```

## After Migration

1. **Regenerate Prisma Client** (if not done automatically):
   ```bash
   pnpm db:generate
   ```

2. **Restart your API server**

3. **Verify**: The 500 errors should be resolved and calendar should work

## Troubleshooting

- **"DIRECT_URL not found"**: Add `DIRECT_URL` to `.env.local` (can be same as `DATABASE_URL` for local dev)
- **"File locked"**: Stop all dev servers, close IDE, then regenerate
- **"Column already exists"**: Migration already applied, just regenerate Prisma Client

