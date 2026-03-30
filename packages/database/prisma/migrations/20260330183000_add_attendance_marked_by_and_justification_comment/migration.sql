-- Add marker user relation for attendance records
ALTER TABLE "attendances"
ADD COLUMN "markedById" TEXT;

CREATE INDEX "attendances_markedById_idx" ON "attendances"("markedById");

ALTER TABLE "attendances"
ADD CONSTRAINT "attendances_markedById_fkey"
FOREIGN KEY ("markedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
