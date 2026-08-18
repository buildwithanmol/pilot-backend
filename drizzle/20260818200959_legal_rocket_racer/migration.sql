ALTER TABLE "asset_contacts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_emails" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "asset_contacts_id_idx" ON "asset_contacts" ("id");--> statement-breakpoint
CREATE INDEX "asset_emails_id_idx" ON "asset_emails" ("id");--> statement-breakpoint
CREATE INDEX "assets_id_idx" ON "assets" ("id");--> statement-breakpoint
CREATE INDEX "attendance_id_idx" ON "attendance" ("id");--> statement-breakpoint
CREATE INDEX "channel_records_id_idx" ON "channel_records" ("id");--> statement-breakpoint
CREATE INDEX "channels_id_idx" ON "channels" ("id");--> statement-breakpoint
CREATE INDEX "employee_folders_id_idx" ON "employee_folders" ("id");--> statement-breakpoint
CREATE INDEX "employees_id_idx" ON "employees" ("id");--> statement-breakpoint
CREATE INDEX "projects_id_idx" ON "projects" ("id");--> statement-breakpoint
CREATE INDEX "settings_id_idx" ON "settings" ("id");