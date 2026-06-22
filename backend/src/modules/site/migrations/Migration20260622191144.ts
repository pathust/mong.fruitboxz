import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260622191144 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop table if exists "site_review" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "site_review" ("id" text not null, "handle" text not null, "product_id" text null, "customer_id" text not null, "rating" integer not null, "comment" text null, "approved" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_review_deleted_at" ON "site_review" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

}
