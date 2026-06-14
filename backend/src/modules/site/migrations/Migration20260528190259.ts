import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260528190259 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "site_banner" ("id" text not null, "title" text not null, "subtitle" text null, "image" text null, "link" text null, "order" integer not null default 0, "active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_banner_deleted_at" ON "site_banner" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "site_chatbot_question_log" ("id" text not null, "message" text not null, "normalized_message" text not null, "response_mode" text null, "resolved" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_chatbot_question_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_chatbot_question_log_deleted_at" ON "site_chatbot_question_log" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "site_review" ("id" text not null, "handle" text not null, "product_id" text null, "customer_id" text not null, "rating" integer not null, "comment" text null, "approved" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_review_deleted_at" ON "site_review" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "site_setting" ("id" text not null, "key" text not null, "value" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_setting_deleted_at" ON "site_setting" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "site_banner" cascade;`);

    this.addSql(`drop table if exists "site_chatbot_question_log" cascade;`);

    this.addSql(`drop table if exists "site_review" cascade;`);

    this.addSql(`drop table if exists "site_setting" cascade;`);
  }

}
