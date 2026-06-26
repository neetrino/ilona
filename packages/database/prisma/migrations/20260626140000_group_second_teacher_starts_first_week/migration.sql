-- Control which teacher leads the first ISO week of the two-teacher rotation.

ALTER TABLE "groups" ADD COLUMN "secondTeacherStartsFirstWeek" BOOLEAN NOT NULL DEFAULT false;
