import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * S04 - pessoas, vínculos e consentimentos (aditiva / expand):
 * - coleções `people`, `memberships`, `consent-records`;
 * - `group_profile.leaders` (`leadersText` permanece até o contract em release futura);
 * - `users.person` (opcional, único) e `media.consentRecord` + `media.publicConsent`.
 * Nenhuma coluna existente é removida ou alterada. `down` idempotente (IF EXISTS).
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_people_external_education_level" AS ENUM('bachelor', 'specialization', 'masters', 'doctorate', 'postdoc', 'other');
  CREATE TYPE "public"."enum_people_visibility" AS ENUM('public', 'admin');
  CREATE TYPE "public"."enum_people_consent_status" AS ENUM('authorized', 'partial', 'revoked', 'none');
  CREATE TYPE "public"."enum_memberships_role" AS ENUM('leader', 'researcher', 'student', 'technician', 'foreign_collaborator', 'external_collaborator');
  CREATE TYPE "public"."enum_memberships_training_level" AS ENUM('postdoc', 'doctorate', 'masters', 'specialization', 'undergraduate', 'other');
  CREATE TYPE "public"."enum_memberships_end_reason" AS ENUM('left', 'training_completed', 'role_changed', 'other');
  CREATE TYPE "public"."enum_memberships_status" AS ENUM('active', 'ended');
  CREATE TYPE "public"."enum_memberships_source" AS ENUM('dgp_transcription', 'manual', 'spreadsheet');
  CREATE TYPE "public"."enum_consent_records_scopes" AS ENUM('public_profile', 'photo', 'email');
  CREATE TYPE "public"."enum_consent_records_method" AS ENUM('signed_form', 'digital_form', 'email', 'other');
  CREATE TABLE "people_name_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "people_external_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level" "enum_people_external_education_level" NOT NULL,
  	"year" numeric,
  	"course" varchar NOT NULL,
  	"institution" varchar NOT NULL,
  	"country" varchar
  );
  
  CREATE TABLE "people_affiliations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"position_text" varchar NOT NULL,
  	"institution_text" varchar NOT NULL,
  	"program_text" varchar,
  	"url" varchar,
  	"current" boolean DEFAULT true
  );
  
  CREATE TABLE "people_other_profiles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"citation_name" varchar,
  	"photo_id" integer,
  	"lattes_url" varchar,
  	"orcid" varchar,
  	"public_email" varchar,
  	"slug" varchar NOT NULL,
  	"visibility" "enum_people_visibility" DEFAULT 'public' NOT NULL,
  	"archived_at" timestamp(3) with time zone,
  	"consent_status" "enum_people_consent_status" DEFAULT 'none',
  	"consent_public_profile" boolean DEFAULT false,
  	"consent_photo" boolean DEFAULT false,
  	"consent_email" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "people_locales" (
  	"short_bio" varchar,
  	"academic_bio" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "people_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "memberships" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_title" varchar,
  	"person_id" integer NOT NULL,
  	"role" "enum_memberships_role" NOT NULL,
  	"training_level" "enum_memberships_training_level",
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"end_reason" "enum_memberships_end_reason",
  	"status" "enum_memberships_status" DEFAULT 'active',
  	"source" "enum_memberships_source" DEFAULT 'manual' NOT NULL,
  	"source_url" varchar,
  	"collected_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "memberships_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"research_lines_id" integer
  );
  
  CREATE TABLE "consent_records_scopes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_consent_records_scopes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "consent_records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_title" varchar,
  	"person_id" integer NOT NULL,
  	"granted_at" timestamp(3) with time zone NOT NULL,
  	"method" "enum_consent_records_method" NOT NULL,
  	"evidence_id" integer,
  	"collected_by" varchar NOT NULL,
  	"revoked_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "group_profile_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "_group_profile_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  ALTER TABLE "users" ADD COLUMN "person_id" integer;
  ALTER TABLE "media" ADD COLUMN "consent_record_id" integer;
  ALTER TABLE "media" ADD COLUMN "public_consent" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "people_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "memberships_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consent_records_id" integer;
  ALTER TABLE "people_name_variants" ADD CONSTRAINT "people_name_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_external_education" ADD CONSTRAINT "people_external_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_affiliations" ADD CONSTRAINT "people_affiliations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_other_profiles" ADD CONSTRAINT "people_other_profiles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people_locales" ADD CONSTRAINT "people_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_texts" ADD CONSTRAINT "people_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "memberships" ADD CONSTRAINT "memberships_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "memberships_rels" ADD CONSTRAINT "memberships_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "memberships_rels" ADD CONSTRAINT "memberships_rels_research_lines_fk" FOREIGN KEY ("research_lines_id") REFERENCES "public"."research_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "consent_records_scopes" ADD CONSTRAINT "consent_records_scopes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."consent_records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_evidence_id_documents_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "group_profile_rels" ADD CONSTRAINT "group_profile_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."group_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "group_profile_rels" ADD CONSTRAINT "group_profile_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_group_profile_v_rels" ADD CONSTRAINT "_group_profile_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_group_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_group_profile_v_rels" ADD CONSTRAINT "_group_profile_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "people_name_variants_order_idx" ON "people_name_variants" USING btree ("_order");
  CREATE INDEX "people_name_variants_parent_id_idx" ON "people_name_variants" USING btree ("_parent_id");
  CREATE INDEX "people_external_education_order_idx" ON "people_external_education" USING btree ("_order");
  CREATE INDEX "people_external_education_parent_id_idx" ON "people_external_education" USING btree ("_parent_id");
  CREATE INDEX "people_affiliations_order_idx" ON "people_affiliations" USING btree ("_order");
  CREATE INDEX "people_affiliations_parent_id_idx" ON "people_affiliations" USING btree ("_parent_id");
  CREATE INDEX "people_other_profiles_order_idx" ON "people_other_profiles" USING btree ("_order");
  CREATE INDEX "people_other_profiles_parent_id_idx" ON "people_other_profiles" USING btree ("_parent_id");
  CREATE INDEX "people_full_name_idx" ON "people" USING btree ("full_name");
  CREATE INDEX "people_photo_idx" ON "people" USING btree ("photo_id");
  CREATE UNIQUE INDEX "people_lattes_url_idx" ON "people" USING btree ("lattes_url");
  CREATE UNIQUE INDEX "people_orcid_idx" ON "people" USING btree ("orcid");
  CREATE UNIQUE INDEX "people_slug_idx" ON "people" USING btree ("slug");
  CREATE INDEX "people_visibility_idx" ON "people" USING btree ("visibility");
  CREATE INDEX "people_archived_at_idx" ON "people" USING btree ("archived_at");
  CREATE INDEX "people_consent_status_idx" ON "people" USING btree ("consent_status");
  CREATE INDEX "people_consent_public_profile_idx" ON "people" USING btree ("consent_public_profile");
  CREATE INDEX "people_updated_at_idx" ON "people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "people" USING btree ("created_at");
  CREATE UNIQUE INDEX "people_locales_locale_parent_id_unique" ON "people_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "people_locales_parent_id_idx" ON "people_locales" USING btree ("_parent_id");
  CREATE INDEX "people_texts_order_parent" ON "people_texts" USING btree ("order","parent_id");
  CREATE INDEX "memberships_person_idx" ON "memberships" USING btree ("person_id");
  CREATE INDEX "memberships_role_idx" ON "memberships" USING btree ("role");
  CREATE INDEX "memberships_status_idx" ON "memberships" USING btree ("status");
  CREATE INDEX "memberships_updated_at_idx" ON "memberships" USING btree ("updated_at");
  CREATE INDEX "memberships_created_at_idx" ON "memberships" USING btree ("created_at");
  CREATE INDEX "memberships_rels_order_idx" ON "memberships_rels" USING btree ("order");
  CREATE INDEX "memberships_rels_parent_idx" ON "memberships_rels" USING btree ("parent_id");
  CREATE INDEX "memberships_rels_path_idx" ON "memberships_rels" USING btree ("path");
  CREATE INDEX "memberships_rels_research_lines_id_idx" ON "memberships_rels" USING btree ("research_lines_id");
  CREATE INDEX "consent_records_scopes_order_idx" ON "consent_records_scopes" USING btree ("order");
  CREATE INDEX "consent_records_scopes_parent_idx" ON "consent_records_scopes" USING btree ("parent_id");
  CREATE INDEX "consent_records_person_idx" ON "consent_records" USING btree ("person_id");
  CREATE INDEX "consent_records_evidence_idx" ON "consent_records" USING btree ("evidence_id");
  CREATE INDEX "consent_records_revoked_at_idx" ON "consent_records" USING btree ("revoked_at");
  CREATE INDEX "consent_records_updated_at_idx" ON "consent_records" USING btree ("updated_at");
  CREATE INDEX "consent_records_created_at_idx" ON "consent_records" USING btree ("created_at");
  CREATE INDEX "group_profile_rels_order_idx" ON "group_profile_rels" USING btree ("order");
  CREATE INDEX "group_profile_rels_parent_idx" ON "group_profile_rels" USING btree ("parent_id");
  CREATE INDEX "group_profile_rels_path_idx" ON "group_profile_rels" USING btree ("path");
  CREATE INDEX "group_profile_rels_people_id_idx" ON "group_profile_rels" USING btree ("people_id");
  CREATE INDEX "_group_profile_v_rels_order_idx" ON "_group_profile_v_rels" USING btree ("order");
  CREATE INDEX "_group_profile_v_rels_parent_idx" ON "_group_profile_v_rels" USING btree ("parent_id");
  CREATE INDEX "_group_profile_v_rels_path_idx" ON "_group_profile_v_rels" USING btree ("path");
  CREATE INDEX "_group_profile_v_rels_people_id_idx" ON "_group_profile_v_rels" USING btree ("people_id");
  ALTER TABLE "users" ADD CONSTRAINT "users_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_consent_record_id_consent_records_id_fk" FOREIGN KEY ("consent_record_id") REFERENCES "public"."consent_records"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_memberships_fk" FOREIGN KEY ("memberships_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consent_records_fk" FOREIGN KEY ("consent_records_id") REFERENCES "public"."consent_records"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "users_person_idx" ON "users" USING btree ("person_id");
  CREATE INDEX "media_consent_record_idx" ON "media" USING btree ("consent_record_id");
  CREATE INDEX "media_public_consent_idx" ON "media" USING btree ("public_consent");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_memberships_id_idx" ON "payload_locked_documents_rels" USING btree ("memberships_id");
  CREATE INDEX "payload_locked_documents_rels_consent_records_id_idx" ON "payload_locked_documents_rels" USING btree ("consent_records_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "people_name_variants" CASCADE;
  DROP TABLE IF EXISTS "people_external_education" CASCADE;
  DROP TABLE IF EXISTS "people_affiliations" CASCADE;
  DROP TABLE IF EXISTS "people_other_profiles" CASCADE;
  DROP TABLE IF EXISTS "people" CASCADE;
  DROP TABLE IF EXISTS "people_locales" CASCADE;
  DROP TABLE IF EXISTS "people_texts" CASCADE;
  DROP TABLE IF EXISTS "memberships" CASCADE;
  DROP TABLE IF EXISTS "memberships_rels" CASCADE;
  DROP TABLE IF EXISTS "consent_records_scopes" CASCADE;
  DROP TABLE IF EXISTS "consent_records" CASCADE;
  DROP TABLE IF EXISTS "group_profile_rels" CASCADE;
  DROP TABLE IF EXISTS "_group_profile_v_rels" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_person_id_people_id_fk";
  
  ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "media_consent_record_id_consent_records_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_people_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_memberships_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_consent_records_fk";
  
  DROP INDEX IF EXISTS "users_person_idx";
  DROP INDEX IF EXISTS "media_consent_record_idx";
  DROP INDEX IF EXISTS "media_public_consent_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_people_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_memberships_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_consent_records_id_idx";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "person_id";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "consent_record_id";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "public_consent";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "people_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "memberships_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "consent_records_id";
  DROP TYPE IF EXISTS "public"."enum_people_external_education_level";
  DROP TYPE IF EXISTS "public"."enum_people_visibility";
  DROP TYPE IF EXISTS "public"."enum_people_consent_status";
  DROP TYPE IF EXISTS "public"."enum_memberships_role";
  DROP TYPE IF EXISTS "public"."enum_memberships_training_level";
  DROP TYPE IF EXISTS "public"."enum_memberships_end_reason";
  DROP TYPE IF EXISTS "public"."enum_memberships_status";
  DROP TYPE IF EXISTS "public"."enum_memberships_source";
  DROP TYPE IF EXISTS "public"."enum_consent_records_scopes";
  DROP TYPE IF EXISTS "public"."enum_consent_records_method";`)
}
