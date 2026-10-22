import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * S02 — papéis e `active` em users; campos de autorização/origem em media; `documents`;
 * `audit-logs` (imutável); globals Navigation, Footer e SiteSettings.
 * Mudança somente aditiva (expand), compatível com a versão anterior do app.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_media_license" AS ENUM('group-authorized', 'all-rights-reserved', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-sa', 'cc-by-nd', 'cc-by-nc-nd', 'cc0');
  CREATE TYPE "public"."enum_media_source" AS ENUM('group-archive', 'portal-production', 'member-provided', 'third-party', 'public-domain');
  CREATE TYPE "public"."enum_documents_type" AS ENUM('group-document', 'report', 'authorization', 'evidence', 'other');
  CREATE TYPE "public"."enum_documents_visibility" AS ENUM('public', 'members', 'admin');
  CREATE TYPE "public"."enum_documents_license" AS ENUM('group-authorized', 'all-rights-reserved', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-sa', 'cc-by-nd', 'cc-by-nc-nd', 'cc0');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('create', 'update', 'delete', 'login', 'role_change', 'publish', 'unpublish', 'export');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_documents_type" NOT NULL,
  	"visibility" "enum_documents_visibility" DEFAULT 'admin' NOT NULL,
  	"license" "enum_documents_license" NOT NULL,
  	"source" varchar,
  	"prefix" varchar DEFAULT 'documents',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  CREATE TABLE "documents_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone NOT NULL,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"target_collection" varchar NOT NULL,
  	"document_id" varchar,
  	"user_id" varchar,
  	"user_email" varchar,
  	"diff_summary" varchar,
  	"ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "navigation_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_items_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "footer_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "footer_legal_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_locales" (
  	"about" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"technical_show_indicators" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"site_name" varchar DEFAULT 'Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar' NOT NULL,
  	"short_name" varchar DEFAULT 'Bioética e Promoção da Saúde' NOT NULL,
  	"default_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "name" varchar;
  ALTER TABLE "users" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp(3) with time zone;
  ALTER TABLE "media" ADD COLUMN "credit" varchar NOT NULL;
  ALTER TABLE "media" ADD COLUMN "license" "enum_media_license" NOT NULL;
  ALTER TABLE "media" ADD COLUMN "source" "enum_media_source" NOT NULL;
  ALTER TABLE "media" ADD COLUMN "source_note" varchar;
  ALTER TABLE "media" ADD COLUMN "contains_identifiable_people" boolean DEFAULT false NOT NULL;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT 'media';
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "documents_id" integer;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents_locales" ADD CONSTRAINT "documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_locales" ADD CONSTRAINT "navigation_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_links" ADD CONSTRAINT "footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_links_locales" ADD CONSTRAINT "footer_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_legal_links" ADD CONSTRAINT "footer_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_legal_links_locales" ADD CONSTRAINT "footer_legal_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_legal_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_locales" ADD CONSTRAINT "footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "documents_visibility_idx" ON "documents" USING btree ("visibility");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  CREATE UNIQUE INDEX "documents_locales_locale_parent_id_unique" ON "documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "documents_locales_parent_id_idx" ON "documents_locales" USING btree ("_parent_id");
  CREATE INDEX "audit_logs_at_idx" ON "audit_logs" USING btree ("at");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_target_collection_idx" ON "audit_logs" USING btree ("target_collection");
  CREATE INDEX "audit_logs_document_id_idx" ON "audit_logs" USING btree ("document_id");
  CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "navigation_items_order_idx" ON "navigation_items" USING btree ("_order");
  CREATE INDEX "navigation_items_parent_id_idx" ON "navigation_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_items_locales_locale_parent_id_unique" ON "navigation_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_items_locales_parent_id_idx" ON "navigation_items_locales" USING btree ("_parent_id");
  CREATE INDEX "footer_links_order_idx" ON "footer_links" USING btree ("_order");
  CREATE INDEX "footer_links_parent_id_idx" ON "footer_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_links_locales_locale_parent_id_unique" ON "footer_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_links_locales_parent_id_idx" ON "footer_links_locales" USING btree ("_parent_id");
  CREATE INDEX "footer_legal_links_order_idx" ON "footer_legal_links" USING btree ("_order");
  CREATE INDEX "footer_legal_links_parent_id_idx" ON "footer_legal_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_legal_links_locales_locale_parent_id_unique" ON "footer_legal_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_legal_links_locales_parent_id_idx" ON "footer_legal_links_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_locales_locale_parent_id_unique" ON "footer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_locales_parent_id_idx" ON "footer_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");`)

  // Migração de dados (idempotente): na S01 toda conta tinha acesso total; as contas já
  // existentes recebem o papel `admin` para não perder o acesso ao painel.
  const roles = await db.execute(sql`
   INSERT INTO "users_roles" ("order", "parent_id", "value")
   SELECT 1, u."id", 'admin' FROM "users" u
   WHERE NOT EXISTS (SELECT 1 FROM "users_roles" r WHERE r."parent_id" = u."id");`)
  payload.logger.info(`[s02] contas existentes promovidas a admin: ${roles.rowCount ?? 0}`)

  // Auditoria imutável no banco (planejamento 13.3 e 17.4): bloqueia UPDATE e TRUNCATE;
  // DELETE só para registros com mais de 2 anos (retenção prevista).
  await db.execute(sql`
   CREATE OR REPLACE FUNCTION "audit_logs_immutable"() RETURNS trigger LANGUAGE plpgsql AS $$
   BEGIN
     IF TG_OP = 'DELETE' AND OLD."at" < (now() - interval '2 years') THEN
       RETURN OLD;
     END IF;
     RAISE EXCEPTION 'audit_logs é somente inserção: % bloqueado', TG_OP
       USING ERRCODE = 'insufficient_privilege';
   END
   $$;
   CREATE TRIGGER "audit_logs_immutable_row" BEFORE UPDATE OR DELETE ON "audit_logs"
     FOR EACH ROW EXECUTE FUNCTION "audit_logs_immutable"();
   CREATE TRIGGER "audit_logs_immutable_truncate" BEFORE TRUNCATE ON "audit_logs"
     FOR EACH STATEMENT EXECUTE FUNCTION "audit_logs_immutable"();`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "documents_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer_legal_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer_legal_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "documents_locales" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "navigation_items" CASCADE;
  DROP TABLE "navigation_items_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "footer_links" CASCADE;
  DROP TABLE "footer_links_locales" CASCADE;
  DROP TABLE "footer_legal_links" CASCADE;
  DROP TABLE "footer_legal_links_locales" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TABLE "footer_locales" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_documents_fk";
  
  DROP INDEX "payload_locked_documents_rels_documents_id_idx";
  ALTER TABLE "users" DROP COLUMN "name";
  ALTER TABLE "users" DROP COLUMN "active";
  ALTER TABLE "users" DROP COLUMN "last_login_at";
  ALTER TABLE "media" DROP COLUMN "credit";
  ALTER TABLE "media" DROP COLUMN "license";
  ALTER TABLE "media" DROP COLUMN "source";
  ALTER TABLE "media" DROP COLUMN "source_note";
  ALTER TABLE "media" DROP COLUMN "contains_identifiable_people";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "media" DROP COLUMN "_objectkey";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "documents_id";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_media_license";
  DROP TYPE "public"."enum_media_source";
  DROP TYPE "public"."enum_documents_type";
  DROP TYPE "public"."enum_documents_visibility";
  DROP TYPE "public"."enum_documents_license";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP FUNCTION IF EXISTS "audit_logs_immutable"();`)
}
