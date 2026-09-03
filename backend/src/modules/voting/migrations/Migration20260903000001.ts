import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260903000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vote" ("id" text not null, "customer_id" text not null, "product_id" text not null, "score" integer not null, "comment" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vote_pkey" primary key ("id"));`);
    this.addSql(`create index if not exists "IDX_vote_deleted_at" on "vote" ("deleted_at") where "deleted_at" is null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vote" cascade;`);
  }

}
