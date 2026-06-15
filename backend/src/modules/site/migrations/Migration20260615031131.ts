import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260615031131 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "site_contact_message" ("id" text not null, "name" text not null, "email" text not null, "phone" text null, "message" text not null, "status" text not null default 'new', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_contact_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_contact_message_deleted_at" ON "site_contact_message" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "site_contact_message" cascade;`);
  }

}
