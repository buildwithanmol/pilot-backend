ALTER TABLE "channels" RENAME COLUMN "status" TO "is_deleted";--> statement-breakpoint
ALTER TABLE "channels" ALTER COLUMN "is_deleted" SET DEFAULT false;--> statement-breakpoint
UPDATE "channels" SET "is_deleted" = false;