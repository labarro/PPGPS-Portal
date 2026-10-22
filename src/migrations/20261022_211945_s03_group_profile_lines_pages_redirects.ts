import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_research_lines_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__research_lines_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__research_lines_v_published_locale" AS ENUM('pt-BR', 'en');
  CREATE TYPE "public"."enum_pages_blocks_callout_tone" AS ENUM('info', 'emphasis');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_callout_tone" AS ENUM('info', 'emphasis');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('pt-BR', 'en');
  CREATE TYPE "public"."enum_redirects_type" AS ENUM('301', '302');
  CREATE TYPE "public"."enum_group_profile_institutional_references_kind" AS ENUM('institution', 'program', 'unit', 'partner', 'funder');
  CREATE TYPE "public"."enum_group_profile_certification_status" AS ENUM('certified', 'not_updated', 'in_preparation');
  CREATE TYPE "public"."enum_group_profile_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__group_profile_v_version_institutional_references_kind" AS ENUM('institution', 'program', 'unit', 'partner', 'funder');
  CREATE TYPE "public"."enum__group_profile_v_version_certification_status" AS ENUM('certified', 'not_updated', 'in_preparation');
  CREATE TYPE "public"."enum__group_profile_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__group_profile_v_published_locale" AS ENUM('pt-BR', 'en');
  CREATE TYPE "public"."enum_homepage_sections_kind" AS ENUM('about', 'research-lines', 'editorial-highlights', 'featured-members', 'recent-publications', 'agenda', 'projects-impact', 'indicators', 'institutional-references');
  CREATE TYPE "public"."enum_homepage_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_version_sections_kind" AS ENUM('about', 'research-lines', 'editorial-highlights', 'featured-members', 'recent-publications', 'agenda', 'projects-impact', 'indicators', 'institutional-references');
  CREATE TYPE "public"."enum__homepage_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_published_locale" AS ENUM('pt-BR', 'en');
  CREATE TABLE "research_lines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"order" numeric DEFAULT 1,
  	"active" boolean DEFAULT true,
  	"provisional" boolean DEFAULT false,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_research_lines_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "research_lines_locales" (
  	"name" varchar,
  	"summary" varchar,
  	"description" jsonb,
  	"related_program_line_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_research_lines_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 1,
  	"version_active" boolean DEFAULT true,
  	"version_provisional" boolean DEFAULT false,
  	"version_source" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__research_lines_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__research_lines_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_research_lines_v_locales" (
  	"version_name" varchar,
  	"version_summary" varchar,
  	"version_description" jsonb,
  	"version_related_program_line_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tone" "enum_pages_blocks_callout_tone" DEFAULT 'info',
  	"href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_callout_locales" (
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_link_list_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_link_list_links_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_link_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_link_list_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_cards_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cards_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tone" "enum__pages_v_blocks_callout_tone" DEFAULT 'info',
  	"href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_callout_locales" (
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_link_list_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_link_list_links_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_link_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_link_list_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cards_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cards_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_url" varchar NOT NULL,
  	"type" "enum_redirects_type" DEFAULT '301' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "group_profile_alternative_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"source" varchar
  );
  
  CREATE TABLE "group_profile_dgp_research_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"source" varchar,
  	"collected_at" timestamp(3) with time zone,
  	"note" varchar
  );
  
  CREATE TABLE "group_profile_institutional_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"kind" "enum_group_profile_institutional_references_kind",
  	"url" varchar,
  	"show_in_footer" boolean DEFAULT false
  );
  
  CREATE TABLE "group_profile_institutional_references_locales" (
  	"relation_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "group_profile" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"provisional_texts" boolean DEFAULT false,
  	"acronym" varchar,
  	"dgp_url" varchar,
  	"dgp_id" varchar,
  	"certification_status" "enum_group_profile_certification_status",
  	"certified_at" timestamp(3) with time zone,
  	"formation_year" numeric,
  	"contact_email" varchar,
  	"source" varchar,
  	"collected_at" timestamp(3) with time zone,
  	"_status" "enum_group_profile_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "group_profile_locales" (
  	"official_name" varchar DEFAULT 'Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar',
  	"summary" varchar,
  	"leaders_text" varchar,
  	"description" jsonb,
  	"objectives" jsonb,
  	"history" jsonb,
  	"predominant_area" varchar,
  	"responsibility_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_group_profile_v_version_alternative_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"source" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_group_profile_v_version_dgp_research_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"source" varchar,
  	"collected_at" timestamp(3) with time zone,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_group_profile_v_version_institutional_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"kind" "enum__group_profile_v_version_institutional_references_kind",
  	"url" varchar,
  	"show_in_footer" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_group_profile_v_version_institutional_references_locales" (
  	"relation_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_group_profile_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_provisional_texts" boolean DEFAULT false,
  	"version_acronym" varchar,
  	"version_dgp_url" varchar,
  	"version_dgp_id" varchar,
  	"version_certification_status" "enum__group_profile_v_version_certification_status",
  	"version_certified_at" timestamp(3) with time zone,
  	"version_formation_year" numeric,
  	"version_contact_email" varchar,
  	"version_source" varchar,
  	"version_collected_at" timestamp(3) with time zone,
  	"version__status" "enum__group_profile_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__group_profile_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_group_profile_v_locales" (
  	"version_official_name" varchar DEFAULT 'Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar',
  	"version_summary" varchar,
  	"version_leaders_text" varchar,
  	"version_description" jsonb,
  	"version_objectives" jsonb,
  	"version_history" jsonb,
  	"version_predominant_area" varchar,
  	"version_responsibility_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "homepage_hero_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "homepage_hero_actions_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_homepage_sections_kind",
  	"enabled" boolean DEFAULT true
  );
  
  CREATE TABLE "homepage_sections_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_homepage_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_locales" (
  	"hero_eyebrow" varchar DEFAULT 'Grupo de pesquisa',
  	"hero_purpose" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_version_hero_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_hero_actions_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__homepage_v_version_sections_kind",
  	"enabled" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_sections_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__homepage_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__homepage_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_homepage_v_locales" (
  	"version_hero_eyebrow" varchar DEFAULT 'Grupo de pesquisa',
  	"version_hero_purpose" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "research_lines_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "redirects_id" integer;
  ALTER TABLE "research_lines_locales" ADD CONSTRAINT "research_lines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."research_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_research_lines_v" ADD CONSTRAINT "_research_lines_v_parent_id_research_lines_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."research_lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_research_lines_v_locales" ADD CONSTRAINT "_research_lines_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_research_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_locales" ADD CONSTRAINT "pages_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_callout" ADD CONSTRAINT "pages_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_callout_locales" ADD CONSTRAINT "pages_blocks_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_link_list_links" ADD CONSTRAINT "pages_blocks_link_list_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_link_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_link_list_links_locales" ADD CONSTRAINT "pages_blocks_link_list_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_link_list_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_link_list" ADD CONSTRAINT "pages_blocks_link_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_link_list_locales" ADD CONSTRAINT "pages_blocks_link_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_link_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_items" ADD CONSTRAINT "pages_blocks_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_items_locales" ADD CONSTRAINT "pages_blocks_cards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_locales" ADD CONSTRAINT "pages_blocks_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" ADD CONSTRAINT "_pages_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_callout" ADD CONSTRAINT "_pages_v_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_callout_locales" ADD CONSTRAINT "_pages_v_blocks_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_link_list_links" ADD CONSTRAINT "_pages_v_blocks_link_list_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_link_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_link_list_links_locales" ADD CONSTRAINT "_pages_v_blocks_link_list_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_link_list_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_link_list" ADD CONSTRAINT "_pages_v_blocks_link_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_link_list_locales" ADD CONSTRAINT "_pages_v_blocks_link_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_link_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_items" ADD CONSTRAINT "_pages_v_blocks_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_items_locales" ADD CONSTRAINT "_pages_v_blocks_cards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards" ADD CONSTRAINT "_pages_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_locales" ADD CONSTRAINT "_pages_v_blocks_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "group_profile_alternative_names" ADD CONSTRAINT "group_profile_alternative_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."group_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "group_profile_dgp_research_lines" ADD CONSTRAINT "group_profile_dgp_research_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."group_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "group_profile_institutional_references" ADD CONSTRAINT "group_profile_institutional_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."group_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "group_profile_institutional_references_locales" ADD CONSTRAINT "group_profile_institutional_references_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."group_profile_institutional_references"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "group_profile_locales" ADD CONSTRAINT "group_profile_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."group_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_group_profile_v_version_alternative_names" ADD CONSTRAINT "_group_profile_v_version_alternative_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_group_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_group_profile_v_version_dgp_research_lines" ADD CONSTRAINT "_group_profile_v_version_dgp_research_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_group_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_group_profile_v_version_institutional_references" ADD CONSTRAINT "_group_profile_v_version_institutional_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_group_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_group_profile_v_version_institutional_references_locales" ADD CONSTRAINT "_group_profile_v_version_institutional_references_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_group_profile_v_version_institutional_references"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_group_profile_v_locales" ADD CONSTRAINT "_group_profile_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_group_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_hero_actions" ADD CONSTRAINT "homepage_hero_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_hero_actions_locales" ADD CONSTRAINT "homepage_hero_actions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_hero_actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_sections_locales" ADD CONSTRAINT "homepage_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_hero_actions" ADD CONSTRAINT "_homepage_v_version_hero_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_hero_actions_locales" ADD CONSTRAINT "_homepage_v_version_hero_actions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_version_hero_actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_sections" ADD CONSTRAINT "_homepage_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_sections_locales" ADD CONSTRAINT "_homepage_v_version_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_locales" ADD CONSTRAINT "_homepage_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "research_lines_slug_idx" ON "research_lines" USING btree ("slug");
  CREATE INDEX "research_lines_active_idx" ON "research_lines" USING btree ("active");
  CREATE INDEX "research_lines_updated_at_idx" ON "research_lines" USING btree ("updated_at");
  CREATE INDEX "research_lines_created_at_idx" ON "research_lines" USING btree ("created_at");
  CREATE INDEX "research_lines__status_idx" ON "research_lines" USING btree ("_status");
  CREATE UNIQUE INDEX "research_lines_locales_locale_parent_id_unique" ON "research_lines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "research_lines_locales_parent_id_idx" ON "research_lines_locales" USING btree ("_parent_id");
  CREATE INDEX "_research_lines_v_parent_idx" ON "_research_lines_v" USING btree ("parent_id");
  CREATE INDEX "_research_lines_v_version_version_slug_idx" ON "_research_lines_v" USING btree ("version_slug");
  CREATE INDEX "_research_lines_v_version_version_active_idx" ON "_research_lines_v" USING btree ("version_active");
  CREATE INDEX "_research_lines_v_version_version_updated_at_idx" ON "_research_lines_v" USING btree ("version_updated_at");
  CREATE INDEX "_research_lines_v_version_version_created_at_idx" ON "_research_lines_v" USING btree ("version_created_at");
  CREATE INDEX "_research_lines_v_version_version__status_idx" ON "_research_lines_v" USING btree ("version__status");
  CREATE INDEX "_research_lines_v_created_at_idx" ON "_research_lines_v" USING btree ("created_at");
  CREATE INDEX "_research_lines_v_updated_at_idx" ON "_research_lines_v" USING btree ("updated_at");
  CREATE INDEX "_research_lines_v_snapshot_idx" ON "_research_lines_v" USING btree ("snapshot");
  CREATE INDEX "_research_lines_v_published_locale_idx" ON "_research_lines_v" USING btree ("published_locale");
  CREATE INDEX "_research_lines_v_latest_idx" ON "_research_lines_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_research_lines_v_locales_locale_parent_id_unique" ON "_research_lines_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_research_lines_v_locales_parent_id_idx" ON "_research_lines_v_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_rich_text_locales_locale_parent_id_unique" ON "pages_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_rich_text_locales_parent_id_idx" ON "pages_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_callout_order_idx" ON "pages_blocks_callout" USING btree ("_order");
  CREATE INDEX "pages_blocks_callout_parent_id_idx" ON "pages_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_callout_path_idx" ON "pages_blocks_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_callout_locales_locale_parent_id_unique" ON "pages_blocks_callout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_callout_locales_parent_id_idx" ON "pages_blocks_callout_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_link_list_links_order_idx" ON "pages_blocks_link_list_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_link_list_links_parent_id_idx" ON "pages_blocks_link_list_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_link_list_links_locales_locale_parent_id_unique" ON "pages_blocks_link_list_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_link_list_links_locales_parent_id_idx" ON "pages_blocks_link_list_links_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_link_list_order_idx" ON "pages_blocks_link_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_link_list_parent_id_idx" ON "pages_blocks_link_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_link_list_path_idx" ON "pages_blocks_link_list" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_link_list_locales_locale_parent_id_unique" ON "pages_blocks_link_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_link_list_locales_parent_id_idx" ON "pages_blocks_link_list_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_items_order_idx" ON "pages_blocks_cards_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_items_parent_id_idx" ON "pages_blocks_cards_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_cards_items_locales_locale_parent_id_unique" ON "pages_blocks_cards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cards_items_locales_parent_id_idx" ON "pages_blocks_cards_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_order_idx" ON "pages_blocks_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_parent_id_idx" ON "pages_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_path_idx" ON "pages_blocks_cards" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_cards_locales_locale_parent_id_unique" ON "pages_blocks_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cards_locales_parent_id_idx" ON "pages_blocks_cards_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_rich_text_locales_locale_parent_id_unique" ON "_pages_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_locales_parent_id_idx" ON "_pages_v_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_callout_order_idx" ON "_pages_v_blocks_callout" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_callout_parent_id_idx" ON "_pages_v_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_callout_path_idx" ON "_pages_v_blocks_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_callout_locales_locale_parent_id_unique" ON "_pages_v_blocks_callout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_callout_locales_parent_id_idx" ON "_pages_v_blocks_callout_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_link_list_links_order_idx" ON "_pages_v_blocks_link_list_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_link_list_links_parent_id_idx" ON "_pages_v_blocks_link_list_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_link_list_links_locales_locale_parent_id_uni" ON "_pages_v_blocks_link_list_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_link_list_links_locales_parent_id_idx" ON "_pages_v_blocks_link_list_links_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_link_list_order_idx" ON "_pages_v_blocks_link_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_link_list_parent_id_idx" ON "_pages_v_blocks_link_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_link_list_path_idx" ON "_pages_v_blocks_link_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_link_list_locales_locale_parent_id_unique" ON "_pages_v_blocks_link_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_link_list_locales_parent_id_idx" ON "_pages_v_blocks_link_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_items_order_idx" ON "_pages_v_blocks_cards_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cards_items_parent_id_idx" ON "_pages_v_blocks_cards_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_cards_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_cards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_items_locales_parent_id_idx" ON "_pages_v_blocks_cards_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_order_idx" ON "_pages_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cards_parent_id_idx" ON "_pages_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_path_idx" ON "_pages_v_blocks_cards" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_cards_locales_locale_parent_id_unique" ON "_pages_v_blocks_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_locales_parent_id_idx" ON "_pages_v_blocks_cards_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "group_profile_alternative_names_order_idx" ON "group_profile_alternative_names" USING btree ("_order");
  CREATE INDEX "group_profile_alternative_names_parent_id_idx" ON "group_profile_alternative_names" USING btree ("_parent_id");
  CREATE INDEX "group_profile_dgp_research_lines_order_idx" ON "group_profile_dgp_research_lines" USING btree ("_order");
  CREATE INDEX "group_profile_dgp_research_lines_parent_id_idx" ON "group_profile_dgp_research_lines" USING btree ("_parent_id");
  CREATE INDEX "group_profile_institutional_references_order_idx" ON "group_profile_institutional_references" USING btree ("_order");
  CREATE INDEX "group_profile_institutional_references_parent_id_idx" ON "group_profile_institutional_references" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "group_profile_institutional_references_locales_locale_parent" ON "group_profile_institutional_references_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "group_profile_institutional_references_locales_parent_id_idx" ON "group_profile_institutional_references_locales" USING btree ("_parent_id");
  CREATE INDEX "group_profile__status_idx" ON "group_profile" USING btree ("_status");
  CREATE UNIQUE INDEX "group_profile_locales_locale_parent_id_unique" ON "group_profile_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "group_profile_locales_parent_id_idx" ON "group_profile_locales" USING btree ("_parent_id");
  CREATE INDEX "_group_profile_v_version_alternative_names_order_idx" ON "_group_profile_v_version_alternative_names" USING btree ("_order");
  CREATE INDEX "_group_profile_v_version_alternative_names_parent_id_idx" ON "_group_profile_v_version_alternative_names" USING btree ("_parent_id");
  CREATE INDEX "_group_profile_v_version_dgp_research_lines_order_idx" ON "_group_profile_v_version_dgp_research_lines" USING btree ("_order");
  CREATE INDEX "_group_profile_v_version_dgp_research_lines_parent_id_idx" ON "_group_profile_v_version_dgp_research_lines" USING btree ("_parent_id");
  CREATE INDEX "_group_profile_v_version_institutional_references_order_idx" ON "_group_profile_v_version_institutional_references" USING btree ("_order");
  CREATE INDEX "_group_profile_v_version_institutional_references_parent_id_idx" ON "_group_profile_v_version_institutional_references" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_group_profile_v_version_institutional_references_locales_lo" ON "_group_profile_v_version_institutional_references_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_group_profile_v_version_institutional_references_locale_idx" ON "_group_profile_v_version_institutional_references_locales" USING btree ("_parent_id");
  CREATE INDEX "_group_profile_v_version_version__status_idx" ON "_group_profile_v" USING btree ("version__status");
  CREATE INDEX "_group_profile_v_created_at_idx" ON "_group_profile_v" USING btree ("created_at");
  CREATE INDEX "_group_profile_v_updated_at_idx" ON "_group_profile_v" USING btree ("updated_at");
  CREATE INDEX "_group_profile_v_snapshot_idx" ON "_group_profile_v" USING btree ("snapshot");
  CREATE INDEX "_group_profile_v_published_locale_idx" ON "_group_profile_v" USING btree ("published_locale");
  CREATE INDEX "_group_profile_v_latest_idx" ON "_group_profile_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_group_profile_v_locales_locale_parent_id_unique" ON "_group_profile_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_group_profile_v_locales_parent_id_idx" ON "_group_profile_v_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_hero_actions_order_idx" ON "homepage_hero_actions" USING btree ("_order");
  CREATE INDEX "homepage_hero_actions_parent_id_idx" ON "homepage_hero_actions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_hero_actions_locales_locale_parent_id_unique" ON "homepage_hero_actions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_hero_actions_locales_parent_id_idx" ON "homepage_hero_actions_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_sections_order_idx" ON "homepage_sections" USING btree ("_order");
  CREATE INDEX "homepage_sections_parent_id_idx" ON "homepage_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_sections_locales_locale_parent_id_unique" ON "homepage_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_sections_locales_parent_id_idx" ON "homepage_sections_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");
  CREATE UNIQUE INDEX "homepage_locales_locale_parent_id_unique" ON "homepage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_locales_parent_id_idx" ON "homepage_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_hero_actions_order_idx" ON "_homepage_v_version_hero_actions" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_hero_actions_parent_id_idx" ON "_homepage_v_version_hero_actions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_version_hero_actions_locales_locale_parent_id_un" ON "_homepage_v_version_hero_actions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_version_hero_actions_locales_parent_id_idx" ON "_homepage_v_version_hero_actions_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_sections_order_idx" ON "_homepage_v_version_sections" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_sections_parent_id_idx" ON "_homepage_v_version_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_version_sections_locales_locale_parent_id_unique" ON "_homepage_v_version_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_version_sections_locales_parent_id_idx" ON "_homepage_v_version_sections_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_v_snapshot_idx" ON "_homepage_v" USING btree ("snapshot");
  CREATE INDEX "_homepage_v_published_locale_idx" ON "_homepage_v" USING btree ("published_locale");
  CREATE INDEX "_homepage_v_latest_idx" ON "_homepage_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_homepage_v_locales_locale_parent_id_unique" ON "_homepage_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_locales_parent_id_idx" ON "_homepage_v_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_research_lines_fk" FOREIGN KEY ("research_lines_id") REFERENCES "public"."research_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_research_lines_id_idx" ON "payload_locked_documents_rels" USING btree ("research_lines_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "research_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "research_lines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_research_lines_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_research_lines_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_callout_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_link_list_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_link_list_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_link_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_link_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_callout_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_link_list_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_link_list_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_link_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_link_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "redirects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_profile_alternative_names" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_profile_dgp_research_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_profile_institutional_references" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_profile_institutional_references_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_profile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_profile_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_group_profile_v_version_alternative_names" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_group_profile_v_version_dgp_research_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_group_profile_v_version_institutional_references" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_group_profile_v_version_institutional_references_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_group_profile_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_group_profile_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_hero_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_hero_actions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_hero_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_hero_actions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "research_lines" CASCADE;
  DROP TABLE IF EXISTS "research_lines_locales" CASCADE;
  DROP TABLE IF EXISTS "_research_lines_v" CASCADE;
  DROP TABLE IF EXISTS "_research_lines_v_locales" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_rich_text" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_rich_text_locales" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_callout" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_callout_locales" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_link_list_links" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_link_list_links_locales" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_link_list" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_link_list_locales" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_cards_items" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_cards_items_locales" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_cards" CASCADE;
  DROP TABLE IF EXISTS "pages_blocks_cards_locales" CASCADE;
  DROP TABLE IF EXISTS "pages" CASCADE;
  DROP TABLE IF EXISTS "pages_locales" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_rich_text_locales" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_callout" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_callout_locales" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_link_list_links" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_link_list_links_locales" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_link_list" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_link_list_locales" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_cards_items" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_cards_items_locales" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_cards" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_cards_locales" CASCADE;
  DROP TABLE IF EXISTS "_pages_v" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_locales" CASCADE;
  DROP TABLE IF EXISTS "redirects" CASCADE;
  DROP TABLE IF EXISTS "group_profile_alternative_names" CASCADE;
  DROP TABLE IF EXISTS "group_profile_dgp_research_lines" CASCADE;
  DROP TABLE IF EXISTS "group_profile_institutional_references" CASCADE;
  DROP TABLE IF EXISTS "group_profile_institutional_references_locales" CASCADE;
  DROP TABLE IF EXISTS "group_profile" CASCADE;
  DROP TABLE IF EXISTS "group_profile_locales" CASCADE;
  DROP TABLE IF EXISTS "_group_profile_v_version_alternative_names" CASCADE;
  DROP TABLE IF EXISTS "_group_profile_v_version_dgp_research_lines" CASCADE;
  DROP TABLE IF EXISTS "_group_profile_v_version_institutional_references" CASCADE;
  DROP TABLE IF EXISTS "_group_profile_v_version_institutional_references_locales" CASCADE;
  DROP TABLE IF EXISTS "_group_profile_v" CASCADE;
  DROP TABLE IF EXISTS "_group_profile_v_locales" CASCADE;
  DROP TABLE IF EXISTS "homepage_hero_actions" CASCADE;
  DROP TABLE IF EXISTS "homepage_hero_actions_locales" CASCADE;
  DROP TABLE IF EXISTS "homepage_sections" CASCADE;
  DROP TABLE IF EXISTS "homepage_sections_locales" CASCADE;
  DROP TABLE IF EXISTS "homepage" CASCADE;
  DROP TABLE IF EXISTS "homepage_locales" CASCADE;
  DROP TABLE IF EXISTS "_homepage_v_version_hero_actions" CASCADE;
  DROP TABLE IF EXISTS "_homepage_v_version_hero_actions_locales" CASCADE;
  DROP TABLE IF EXISTS "_homepage_v_version_sections" CASCADE;
  DROP TABLE IF EXISTS "_homepage_v_version_sections_locales" CASCADE;
  DROP TABLE IF EXISTS "_homepage_v" CASCADE;
  DROP TABLE IF EXISTS "_homepage_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_research_lines_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redirects_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_research_lines_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_redirects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "research_lines_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "redirects_id";
  DROP TYPE IF EXISTS "public"."enum_research_lines_status";
  DROP TYPE IF EXISTS "public"."enum__research_lines_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__research_lines_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_callout_tone";
  DROP TYPE IF EXISTS "public"."enum_pages_status";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_callout_tone";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__pages_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_redirects_type";
  DROP TYPE IF EXISTS "public"."enum_group_profile_institutional_references_kind";
  DROP TYPE IF EXISTS "public"."enum_group_profile_certification_status";
  DROP TYPE IF EXISTS "public"."enum_group_profile_status";
  DROP TYPE IF EXISTS "public"."enum__group_profile_v_version_institutional_references_kind";
  DROP TYPE IF EXISTS "public"."enum__group_profile_v_version_certification_status";
  DROP TYPE IF EXISTS "public"."enum__group_profile_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__group_profile_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_homepage_sections_kind";
  DROP TYPE IF EXISTS "public"."enum_homepage_status";
  DROP TYPE IF EXISTS "public"."enum__homepage_v_version_sections_kind";
  DROP TYPE IF EXISTS "public"."enum__homepage_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__homepage_v_published_locale";`)
}
