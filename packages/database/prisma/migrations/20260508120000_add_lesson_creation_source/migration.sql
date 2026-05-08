-- CreateEnum
CREATE TYPE "LessonCreationSource" AS ENUM ('MANUAL', 'GROUP_SCHEDULE');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "creationSource" "LessonCreationSource" NOT NULL DEFAULT 'MANUAL';
