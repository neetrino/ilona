CREATE TABLE IF NOT EXISTS "manager_profiles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "manager_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "manager_profiles_userId_key"
  ON "manager_profiles"("userId");

CREATE INDEX IF NOT EXISTS "manager_profiles_centerId_idx"
  ON "manager_profiles"("centerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'manager_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "manager_profiles"
      ADD CONSTRAINT "manager_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'manager_profiles_centerId_fkey'
  ) THEN
    ALTER TABLE "manager_profiles"
      ADD CONSTRAINT "manager_profiles_centerId_fkey"
      FOREIGN KEY ("centerId") REFERENCES "centers"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
