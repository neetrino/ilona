DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "manager_profiles"
    GROUP BY "centerId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one manager per center: duplicate center assignments exist in manager_profiles';
  END IF;
END $$;

DROP INDEX IF EXISTS "manager_profiles_centerId_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "manager_profiles_centerId_key"
  ON "manager_profiles"("centerId");
