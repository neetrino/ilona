-- Add optional age and parent passport info to students
ALTER TABLE "students"
ADD COLUMN "age" INTEGER,
ADD COLUMN "parentPassportInfo" TEXT;

-- Create student group history table
CREATE TABLE "student_group_histories" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "student_group_histories_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "student_group_histories_studentId_idx" ON "student_group_histories"("studentId");
CREATE INDEX "student_group_histories_groupId_idx" ON "student_group_histories"("groupId");
CREATE INDEX "student_group_histories_studentId_leftAt_idx" ON "student_group_histories"("studentId", "leftAt");

-- Foreign keys
ALTER TABLE "student_group_histories"
ADD CONSTRAINT "student_group_histories_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "students"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_group_histories"
ADD CONSTRAINT "student_group_histories_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "groups"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
