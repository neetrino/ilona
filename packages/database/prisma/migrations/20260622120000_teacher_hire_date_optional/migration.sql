-- Make teacher hireDate optional (experience is unset when null).
ALTER TABLE "teachers" ALTER COLUMN "hireDate" DROP DEFAULT;
ALTER TABLE "teachers" ALTER COLUMN "hireDate" DROP NOT NULL;
