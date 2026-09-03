import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260903000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "bulk_order" ("id" text not null, "company_name" text not null, "contact_email" text not null, "contact_phone" text not null, "requested_date" timestamptz not null, "budget" numeric not null, "raw_budget" jsonb not null, "note" text null, "status" text check ("status" in ('pending', 'reviewed', 'fulfilled', 'cancelled')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "bulk_order_pkey" primary key ("id"));`);
    this.addSql(`create index if not exists "IDX_bulk_order_deleted_at" on "bulk_order" ("deleted_at") where "deleted_at" is null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "bulk_order" cascade;`);
  }

}
