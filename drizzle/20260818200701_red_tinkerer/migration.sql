CREATE TYPE "attendance_status" AS ENUM('present', 'absent');--> statement-breakpoint
CREATE TYPE "channel_platform" AS ENUM('yt', 'ig');--> statement-breakpoint
CREATE TYPE "employee_role" AS ENUM('admin', 'smm', 'editor');--> statement-breakpoint
CREATE TABLE "asset_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"a_id" uuid NOT NULL,
	"contact" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"a_id" uuid NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"e_id" uuid NOT NULL,
	"model" text NOT NULL,
	"imei1" text,
	"imei2" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"e_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" "attendance_status" NOT NULL,
	"edited" boolean DEFAULT false NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"e_id" uuid NOT NULL,
	"c_id" uuid NOT NULL,
	"p_id" uuid NOT NULL,
	"date" date NOT NULL,
	"link" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"e_id" uuid NOT NULL,
	"name" text,
	"platform" "channel_platform",
	"url" text NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"e_id" uuid NOT NULL,
	"folder_id" text,
	"folder_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text NOT NULL UNIQUE,
	"password" text NOT NULL,
	"role" "employee_role" NOT NULL,
	"salary" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"editor_daily_upload_limit" integer,
	"smm_channel_limit" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "asset_contacts_a_id_idx" ON "asset_contacts" ("a_id");--> statement-breakpoint
CREATE INDEX "asset_emails_a_id_idx" ON "asset_emails" ("a_id");--> statement-breakpoint
CREATE INDEX "assets_e_id_idx" ON "assets" ("e_id");--> statement-breakpoint
CREATE INDEX "attendance_e_id_idx" ON "attendance" ("e_id");--> statement-breakpoint
CREATE INDEX "channel_records_e_id_idx" ON "channel_records" ("e_id");--> statement-breakpoint
CREATE INDEX "channel_records_c_id_idx" ON "channel_records" ("c_id");--> statement-breakpoint
CREATE INDEX "channel_records_p_id_idx" ON "channel_records" ("p_id");--> statement-breakpoint
CREATE INDEX "channels_e_id_idx" ON "channels" ("e_id");--> statement-breakpoint
CREATE INDEX "employee_folders_e_id_idx" ON "employee_folders" ("e_id");--> statement-breakpoint
ALTER TABLE "asset_contacts" ADD CONSTRAINT "asset_contacts_a_id_assets_id_fkey" FOREIGN KEY ("a_id") REFERENCES "assets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "asset_emails" ADD CONSTRAINT "asset_emails_a_id_assets_id_fkey" FOREIGN KEY ("a_id") REFERENCES "assets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_e_id_employees_id_fkey" FOREIGN KEY ("e_id") REFERENCES "employees"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_e_id_employees_id_fkey" FOREIGN KEY ("e_id") REFERENCES "employees"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "channel_records" ADD CONSTRAINT "channel_records_e_id_employees_id_fkey" FOREIGN KEY ("e_id") REFERENCES "employees"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "channel_records" ADD CONSTRAINT "channel_records_c_id_channels_id_fkey" FOREIGN KEY ("c_id") REFERENCES "channels"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "channel_records" ADD CONSTRAINT "channel_records_p_id_projects_id_fkey" FOREIGN KEY ("p_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_e_id_employees_id_fkey" FOREIGN KEY ("e_id") REFERENCES "employees"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "employee_folders" ADD CONSTRAINT "employee_folders_e_id_employees_id_fkey" FOREIGN KEY ("e_id") REFERENCES "employees"("id") ON DELETE CASCADE;