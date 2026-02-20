-- Migration to add colorHex column to centers table
-- Run this SQL directly in your PostgreSQL database if Prisma migrate fails

-- Check if column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'centers' 
        AND column_name = 'colorHex'
    ) THEN
        ALTER TABLE "centers" ADD COLUMN "colorHex" TEXT;
        RAISE NOTICE 'Column colorHex added successfully';
    ELSE
        RAISE NOTICE 'Column colorHex already exists';
    END IF;
END $$;

