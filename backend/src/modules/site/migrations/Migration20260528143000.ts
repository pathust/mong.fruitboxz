import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260528143000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "site_chatbot_question_log" ("id" text not null, "message" text not null, "normalized_message" text not null, "response_mode" text null, "resolved" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_chatbot_question_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_chatbot_question_log_deleted_at" ON "site_chatbot_question_log" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "site_chatbot_question_log" cascade;`);
  }

}
