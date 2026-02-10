-- Migration to add logoUrl column to system_settings table
-- Run this SQL directly in your PostgreSQL database if Prisma migrate fails

-- Check if column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings' 
        AND column_name = 'logoUrl'
    ) THEN
        ALTER TABLE "system_settings" ADD COLUMN "logoUrl" TEXT;
        RAISE NOTICE 'Column logoUrl added successfully';
    ELSE
        RAISE NOTICE 'Column logoUrl already exists';
    END IF;
END $$;

