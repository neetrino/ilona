-- ============================================
-- Apply Lesson Obligations Migration
-- ============================================
-- Run this SQL directly in your PostgreSQL database
-- You can use psql, pgAdmin, or any database client
--
-- Usage:
--   psql $DATABASE_URL -f apply_lesson_obligations_manual.sql
--   OR copy and paste into your database client
-- ============================================

-- Add new obligation tracking columns to lessons table
DO $$
BEGIN
    -- Add absenceMarked column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'absenceMarked'
    ) THEN
        ALTER TABLE "lessons" ADD COLUMN "absenceMarked" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Column absenceMarked added successfully';
    ELSE
        RAISE NOTICE 'Column absenceMarked already exists';
    END IF;

    -- Add absenceMarkedAt column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'absenceMarkedAt'
    ) THEN
        ALTER TABLE "lessons" ADD COLUMN "absenceMarkedAt" TIMESTAMP(3);
        RAISE NOTICE 'Column absenceMarkedAt added successfully';
    ELSE
        RAISE NOTICE 'Column absenceMarkedAt already exists';
    END IF;

    -- Add voiceSent column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'voiceSent'
    ) THEN
        ALTER TABLE "lessons" ADD COLUMN "voiceSent" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Column voiceSent added successfully';
    ELSE
        RAISE NOTICE 'Column voiceSent already exists';
    END IF;

    -- Add voiceSentAt column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'voiceSentAt'
    ) THEN
        ALTER TABLE "lessons" ADD COLUMN "voiceSentAt" TIMESTAMP(3);
        RAISE NOTICE 'Column voiceSentAt added successfully';
    ELSE
        RAISE NOTICE 'Column voiceSentAt already exists';
    END IF;

    -- Add textSent column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'textSent'
    ) THEN
        ALTER TABLE "lessons" ADD COLUMN "textSent" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Column textSent added successfully';
    ELSE
        RAISE NOTICE 'Column textSent already exists';
    END IF;

    -- Add textSentAt column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'textSentAt'
    ) THEN
        ALTER TABLE "lessons" ADD COLUMN "textSentAt" TIMESTAMP(3);
        RAISE NOTICE 'Column textSentAt added successfully';
    ELSE
        RAISE NOTICE 'Column textSentAt already exists';
    END IF;
END $$;










