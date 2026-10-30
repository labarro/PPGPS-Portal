import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_essays_authors_role" AS ENUM('author', 'co_author', 'guest');
  CREATE TYPE "public"."enum_essays_review_history_from" AS ENUM('draft', 'in_review', 'returned', 'approved', 'scheduled', 'published', 'archived');
  CREATE TYPE "public"."enum_essays_review_history_to" AS ENUM('draft', 'in_review', 'returned', 'approved', 'scheduled', 'published', 'archived');
  CREATE TYPE "public"."enum_essays_nature" AS ENUM('reflective_essay', 'science_communication', 'critical_analysis', 'academic_opinion', 'review', 'group_news', 'interview');
  CREATE TYPE "public"."enum_essays_development_stage" AS ENUM('idea', 'essay', 'in_discussion', 'in_academic_development', 'published_as_article');
  CREATE TYPE "public"."enum_essays_license" AS ENUM('cc-by-nc-nd', 'cc-by-nc-sa', 'cc-by-nc', 'cc-by-nd', 'cc-by-sa', 'cc-by', 'all-rights-reserved');
  CREATE TYPE "public"."enum_essays_workflow_status" AS ENUM('draft', 'in_review', 'returned', 'approved', 'scheduled', 'published', 'archived');
  CREATE TYPE "public"."enum_essays_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__essays_v_version_authors_role" AS ENUM('author', 'co_author', 'guest');
  CREATE TYPE "public"."enum__essays_v_version_review_history_from" AS ENUM('draft', 'in_review', 'returned', 'approved', 'scheduled', 'published', 'archived');
  CREATE TYPE "public"."enum__essays_v_version_review_history_to" AS ENUM('draft', 'in_review', 'returned', 'approved', 'scheduled', 'published', 'archived');
  CREATE TYPE "public"."enum__essays_v_version_nature" AS ENUM('reflective_essay', 'science_communication', 'critical_analysis', 'academic_opinion', 'review', 'group_news', 'interview');
  CREATE TYPE "public"."enum__essays_v_version_development_stage" AS ENUM('idea', 'essay', 'in_discussion', 'in_academic_development', 'published_as_article');
  CREATE TYPE "public"."enum__essays_v_version_license" AS ENUM('cc-by-nc-nd', 'cc-by-nc-sa', 'cc-by-nc', 'cc-by-nd', 'cc-by-sa', 'cc-by', 'all-rights-reserved');
  CREATE TYPE "public"."enum__essays_v_version_workflow_status" AS ENUM('draft', 'in_review', 'returned', 'approved', 'scheduled', 'published', 'archived');
  CREATE TYPE "public"."enum__essays_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__essays_v_published_locale" AS ENUM('pt-BR', 'en');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'publishScheduledEssays');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'publishScheduledEssays');
  CREATE TYPE "public"."enum_site_settings_editorial_default_license" AS ENUM('cc-by-nc-nd', 'cc-by-nc-sa', 'cc-by-nc', 'cc-by-nd', 'cc-by-sa', 'cc-by', 'all-rights-reserved');
  ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE IF NOT EXISTS 'workflow';
  ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE IF NOT EXISTS 'approve';
  CREATE TABLE "essays_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" "enum_essays_authors_role" DEFAULT 'author',
  	"person_id" integer,
  	"name" varchar,
  	"bio" varchar
  );
  
  CREATE TABLE "essays_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"authors" varchar,
  	"title" varchar,
  	"source" varchar,
  	"publisher" varchar,
  	"year" numeric,
  	"doi" varchar,
  	"url" varchar,
  	"accessed_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "essays_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" "enum_essays_review_history_from",
  	"to" "enum_essays_review_history_to",
  	"at" timestamp(3) with time zone,
  	"actor_id" integer,
  	"actor_name" varchar,
  	"comment" varchar
  );
  
  CREATE TABLE "essays" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_id" integer,
  	"nature" "enum_essays_nature",
  	"development_stage" "enum_essays_development_stage" DEFAULT 'essay',
  	"category_id" integer,
  	"license" "enum_essays_license",
  	"checklist_nature_indicated" boolean DEFAULT false,
  	"checklist_grounded_arguments" boolean DEFAULT false,
  	"checklist_no_personal_data" boolean DEFAULT false,
  	"checklist_images_licensed" boolean DEFAULT false,
  	"checklist_accessible_language" boolean DEFAULT false,
  	"checklist_conflicts_declared" boolean DEFAULT false,
  	"checklist_no_clinical_advice" boolean DEFAULT false,
  	"checklist_not_institutional_position" boolean DEFAULT false,
  	"internal_notes" varchar,
  	"slug" varchar,
  	"workflow_status" "enum_essays_workflow_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"scheduled_at" timestamp(3) with time zone,
  	"revised_at" timestamp(3) with time zone,
  	"archived_at" timestamp(3) with time zone,
  	"reading_time" numeric,
  	"submitted_by_id" integer,
  	"submitted_at" timestamp(3) with time zone,
  	"approved_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"published_by_id" integer,
  	"archived_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_essays_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "essays_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"correction_note" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "essays_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "_essays_v_version_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum__essays_v_version_authors_role" DEFAULT 'author',
  	"person_id" integer,
  	"name" varchar,
  	"bio" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_essays_v_version_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"authors" varchar,
  	"title" varchar,
  	"source" varchar,
  	"publisher" varchar,
  	"year" numeric,
  	"doi" varchar,
  	"url" varchar,
  	"accessed_at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_essays_v_version_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" "enum__essays_v_version_review_history_from",
  	"to" "enum__essays_v_version_review_history_to",
  	"at" timestamp(3) with time zone,
  	"actor_id" integer,
  	"actor_name" varchar,
  	"comment" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_essays_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_cover_id" integer,
  	"version_nature" "enum__essays_v_version_nature",
  	"version_development_stage" "enum__essays_v_version_development_stage" DEFAULT 'essay',
  	"version_category_id" integer,
  	"version_license" "enum__essays_v_version_license",
  	"version_checklist_nature_indicated" boolean DEFAULT false,
  	"version_checklist_grounded_arguments" boolean DEFAULT false,
  	"version_checklist_no_personal_data" boolean DEFAULT false,
  	"version_checklist_images_licensed" boolean DEFAULT false,
  	"version_checklist_accessible_language" boolean DEFAULT false,
  	"version_checklist_conflicts_declared" boolean DEFAULT false,
  	"version_checklist_no_clinical_advice" boolean DEFAULT false,
  	"version_checklist_not_institutional_position" boolean DEFAULT false,
  	"version_internal_notes" varchar,
  	"version_slug" varchar,
  	"version_workflow_status" "enum__essays_v_version_workflow_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_scheduled_at" timestamp(3) with time zone,
  	"version_revised_at" timestamp(3) with time zone,
  	"version_archived_at" timestamp(3) with time zone,
  	"version_reading_time" numeric,
  	"version_submitted_by_id" integer,
  	"version_submitted_at" timestamp(3) with time zone,
  	"version_approved_by_id" integer,
  	"version_approved_at" timestamp(3) with time zone,
  	"version_published_by_id" integer,
  	"version_archived_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__essays_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__essays_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_essays_v_locales" (
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_correction_note" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_essays_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"primary" boolean DEFAULT false,
  	"order" numeric DEFAULT 10,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"essays_id" integer
  );
  
  CREATE TABLE "_homepage_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"essays_id" integer
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "essays_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "editorial_default_license" "enum_site_settings_editorial_default_license" DEFAULT 'cc-by-nc-nd' NOT NULL;
  ALTER TABLE "site_settings_locales" ADD COLUMN "editorial_notice_complement" varchar;
  ALTER TABLE "essays_authors" ADD CONSTRAINT "essays_authors_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "essays_authors" ADD CONSTRAINT "essays_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "essays_references" ADD CONSTRAINT "essays_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "essays_review_history" ADD CONSTRAINT "essays_review_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "essays_review_history" ADD CONSTRAINT "essays_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "essays" ADD CONSTRAINT "essays_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "essays" ADD CONSTRAINT "essays_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "essays" ADD CONSTRAINT "essays_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "essays" ADD CONSTRAINT "essays_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "essays" ADD CONSTRAINT "essays_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "essays" ADD CONSTRAINT "essays_archived_by_id_users_id_fk" FOREIGN KEY ("archived_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "essays_locales" ADD CONSTRAINT "essays_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "essays_rels" ADD CONSTRAINT "essays_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "essays_rels" ADD CONSTRAINT "essays_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_essays_v_version_authors" ADD CONSTRAINT "_essays_v_version_authors_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v_version_authors" ADD CONSTRAINT "_essays_v_version_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_essays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_essays_v_version_references" ADD CONSTRAINT "_essays_v_version_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_essays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_essays_v_version_review_history" ADD CONSTRAINT "_essays_v_version_review_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v_version_review_history" ADD CONSTRAINT "_essays_v_version_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_essays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_essays_v" ADD CONSTRAINT "_essays_v_parent_id_essays_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."essays"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v" ADD CONSTRAINT "_essays_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v" ADD CONSTRAINT "_essays_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v" ADD CONSTRAINT "_essays_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v" ADD CONSTRAINT "_essays_v_version_approved_by_id_users_id_fk" FOREIGN KEY ("version_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v" ADD CONSTRAINT "_essays_v_version_published_by_id_users_id_fk" FOREIGN KEY ("version_published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v" ADD CONSTRAINT "_essays_v_version_archived_by_id_users_id_fk" FOREIGN KEY ("version_archived_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_essays_v_locales" ADD CONSTRAINT "_essays_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_essays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_essays_v_rels" ADD CONSTRAINT "_essays_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_essays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_essays_v_rels" ADD CONSTRAINT "_essays_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_essays_fk" FOREIGN KEY ("essays_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_essays_fk" FOREIGN KEY ("essays_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "essays_authors_order_idx" ON "essays_authors" USING btree ("_order");
  CREATE INDEX "essays_authors_parent_id_idx" ON "essays_authors" USING btree ("_parent_id");
  CREATE INDEX "essays_authors_person_idx" ON "essays_authors" USING btree ("person_id");
  CREATE INDEX "essays_references_order_idx" ON "essays_references" USING btree ("_order");
  CREATE INDEX "essays_references_parent_id_idx" ON "essays_references" USING btree ("_parent_id");
  CREATE INDEX "essays_review_history_order_idx" ON "essays_review_history" USING btree ("_order");
  CREATE INDEX "essays_review_history_parent_id_idx" ON "essays_review_history" USING btree ("_parent_id");
  CREATE INDEX "essays_review_history_actor_idx" ON "essays_review_history" USING btree ("actor_id");
  CREATE INDEX "essays_cover_idx" ON "essays" USING btree ("cover_id");
  CREATE INDEX "essays_nature_idx" ON "essays" USING btree ("nature");
  CREATE INDEX "essays_category_idx" ON "essays" USING btree ("category_id");
  CREATE UNIQUE INDEX "essays_slug_idx" ON "essays" USING btree ("slug");
  CREATE INDEX "essays_workflow_status_idx" ON "essays" USING btree ("workflow_status");
  CREATE INDEX "essays_published_at_idx" ON "essays" USING btree ("published_at");
  CREATE INDEX "essays_archived_at_idx" ON "essays" USING btree ("archived_at");
  CREATE INDEX "essays_submitted_by_idx" ON "essays" USING btree ("submitted_by_id");
  CREATE INDEX "essays_approved_by_idx" ON "essays" USING btree ("approved_by_id");
  CREATE INDEX "essays_published_by_idx" ON "essays" USING btree ("published_by_id");
  CREATE INDEX "essays_archived_by_idx" ON "essays" USING btree ("archived_by_id");
  CREATE INDEX "essays_updated_at_idx" ON "essays" USING btree ("updated_at");
  CREATE INDEX "essays_created_at_idx" ON "essays" USING btree ("created_at");
  CREATE INDEX "essays__status_idx" ON "essays" USING btree ("_status");
  CREATE UNIQUE INDEX "essays_locales_locale_parent_id_unique" ON "essays_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "essays_locales_parent_id_idx" ON "essays_locales" USING btree ("_parent_id");
  CREATE INDEX "essays_rels_order_idx" ON "essays_rels" USING btree ("order");
  CREATE INDEX "essays_rels_parent_idx" ON "essays_rels" USING btree ("parent_id");
  CREATE INDEX "essays_rels_path_idx" ON "essays_rels" USING btree ("path");
  CREATE INDEX "essays_rels_tags_id_idx" ON "essays_rels" USING btree ("tags_id");
  CREATE INDEX "_essays_v_version_authors_order_idx" ON "_essays_v_version_authors" USING btree ("_order");
  CREATE INDEX "_essays_v_version_authors_parent_id_idx" ON "_essays_v_version_authors" USING btree ("_parent_id");
  CREATE INDEX "_essays_v_version_authors_person_idx" ON "_essays_v_version_authors" USING btree ("person_id");
  CREATE INDEX "_essays_v_version_references_order_idx" ON "_essays_v_version_references" USING btree ("_order");
  CREATE INDEX "_essays_v_version_references_parent_id_idx" ON "_essays_v_version_references" USING btree ("_parent_id");
  CREATE INDEX "_essays_v_version_review_history_order_idx" ON "_essays_v_version_review_history" USING btree ("_order");
  CREATE INDEX "_essays_v_version_review_history_parent_id_idx" ON "_essays_v_version_review_history" USING btree ("_parent_id");
  CREATE INDEX "_essays_v_version_review_history_actor_idx" ON "_essays_v_version_review_history" USING btree ("actor_id");
  CREATE INDEX "_essays_v_parent_idx" ON "_essays_v" USING btree ("parent_id");
  CREATE INDEX "_essays_v_version_version_cover_idx" ON "_essays_v" USING btree ("version_cover_id");
  CREATE INDEX "_essays_v_version_version_nature_idx" ON "_essays_v" USING btree ("version_nature");
  CREATE INDEX "_essays_v_version_version_category_idx" ON "_essays_v" USING btree ("version_category_id");
  CREATE INDEX "_essays_v_version_version_slug_idx" ON "_essays_v" USING btree ("version_slug");
  CREATE INDEX "_essays_v_version_version_workflow_status_idx" ON "_essays_v" USING btree ("version_workflow_status");
  CREATE INDEX "_essays_v_version_version_published_at_idx" ON "_essays_v" USING btree ("version_published_at");
  CREATE INDEX "_essays_v_version_version_archived_at_idx" ON "_essays_v" USING btree ("version_archived_at");
  CREATE INDEX "_essays_v_version_version_submitted_by_idx" ON "_essays_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_essays_v_version_version_approved_by_idx" ON "_essays_v" USING btree ("version_approved_by_id");
  CREATE INDEX "_essays_v_version_version_published_by_idx" ON "_essays_v" USING btree ("version_published_by_id");
  CREATE INDEX "_essays_v_version_version_archived_by_idx" ON "_essays_v" USING btree ("version_archived_by_id");
  CREATE INDEX "_essays_v_version_version_updated_at_idx" ON "_essays_v" USING btree ("version_updated_at");
  CREATE INDEX "_essays_v_version_version_created_at_idx" ON "_essays_v" USING btree ("version_created_at");
  CREATE INDEX "_essays_v_version_version__status_idx" ON "_essays_v" USING btree ("version__status");
  CREATE INDEX "_essays_v_created_at_idx" ON "_essays_v" USING btree ("created_at");
  CREATE INDEX "_essays_v_updated_at_idx" ON "_essays_v" USING btree ("updated_at");
  CREATE INDEX "_essays_v_snapshot_idx" ON "_essays_v" USING btree ("snapshot");
  CREATE INDEX "_essays_v_published_locale_idx" ON "_essays_v" USING btree ("published_locale");
  CREATE INDEX "_essays_v_latest_idx" ON "_essays_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_essays_v_locales_locale_parent_id_unique" ON "_essays_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_essays_v_locales_parent_id_idx" ON "_essays_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_essays_v_rels_order_idx" ON "_essays_v_rels" USING btree ("order");
  CREATE INDEX "_essays_v_rels_parent_idx" ON "_essays_v_rels" USING btree ("parent_id");
  CREATE INDEX "_essays_v_rels_path_idx" ON "_essays_v_rels" USING btree ("path");
  CREATE INDEX "_essays_v_rels_tags_id_idx" ON "_essays_v_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_primary_idx" ON "categories" USING btree ("primary");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "tags_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tags_locales_parent_id_idx" ON "tags_locales" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_essays_id_idx" ON "homepage_rels" USING btree ("essays_id");
  CREATE INDEX "_homepage_v_rels_order_idx" ON "_homepage_v_rels" USING btree ("order");
  CREATE INDEX "_homepage_v_rels_parent_idx" ON "_homepage_v_rels" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_rels_path_idx" ON "_homepage_v_rels" USING btree ("path");
  CREATE INDEX "_homepage_v_rels_essays_id_idx" ON "_homepage_v_rels" USING btree ("essays_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_essays_fk" FOREIGN KEY ("essays_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_essays_id_idx" ON "payload_locked_documents_rels" USING btree ("essays_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "essays_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "essays_references" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "essays_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "essays" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "essays_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "essays_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_essays_v_version_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_essays_v_version_references" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_essays_v_version_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_essays_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_essays_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_essays_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "essays_authors" CASCADE;
  DROP TABLE IF EXISTS "essays_references" CASCADE;
  DROP TABLE IF EXISTS "essays_review_history" CASCADE;
  DROP TABLE IF EXISTS "essays" CASCADE;
  DROP TABLE IF EXISTS "essays_locales" CASCADE;
  DROP TABLE IF EXISTS "essays_rels" CASCADE;
  DROP TABLE IF EXISTS "_essays_v_version_authors" CASCADE;
  DROP TABLE IF EXISTS "_essays_v_version_references" CASCADE;
  DROP TABLE IF EXISTS "_essays_v_version_review_history" CASCADE;
  DROP TABLE IF EXISTS "_essays_v" CASCADE;
  DROP TABLE IF EXISTS "_essays_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_essays_v_rels" CASCADE;
  DROP TABLE IF EXISTS "categories" CASCADE;
  DROP TABLE IF EXISTS "categories_locales" CASCADE;
  DROP TABLE IF EXISTS "tags" CASCADE;
  DROP TABLE IF EXISTS "tags_locales" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs_log" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs" CASCADE;
  DROP TABLE IF EXISTS "homepage_rels" CASCADE;
  DROP TABLE IF EXISTS "_homepage_v_rels" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_essays_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tags_fk";
  
  -- Os valores "workflow" e "approve" do enum da auditoria são mantidos no down: a auditoria é
  -- imutável e o up usa ADD VALUE IF NOT EXISTS.
  DROP INDEX IF EXISTS "payload_locked_documents_rels_essays_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tags_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "essays_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tags_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "editorial_default_license";
  ALTER TABLE "site_settings_locales" DROP COLUMN IF EXISTS "editorial_notice_complement";
  DROP TYPE IF EXISTS "public"."enum_essays_authors_role";
  DROP TYPE IF EXISTS "public"."enum_essays_review_history_from";
  DROP TYPE IF EXISTS "public"."enum_essays_review_history_to";
  DROP TYPE IF EXISTS "public"."enum_essays_nature";
  DROP TYPE IF EXISTS "public"."enum_essays_development_stage";
  DROP TYPE IF EXISTS "public"."enum_essays_license";
  DROP TYPE IF EXISTS "public"."enum_essays_workflow_status";
  DROP TYPE IF EXISTS "public"."enum_essays_status";
  DROP TYPE IF EXISTS "public"."enum__essays_v_version_authors_role";
  DROP TYPE IF EXISTS "public"."enum__essays_v_version_review_history_from";
  DROP TYPE IF EXISTS "public"."enum__essays_v_version_review_history_to";
  DROP TYPE IF EXISTS "public"."enum__essays_v_version_nature";
  DROP TYPE IF EXISTS "public"."enum__essays_v_version_development_stage";
  DROP TYPE IF EXISTS "public"."enum__essays_v_version_license";
  DROP TYPE IF EXISTS "public"."enum__essays_v_version_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__essays_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__essays_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_state";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  DROP TYPE IF EXISTS "public"."enum_site_settings_editorial_default_license";`)
}
