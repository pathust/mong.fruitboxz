import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260527145034 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "permission" ("id" text not null, "name" text not null, "description" text null, "guard_name" text not null default 'admin', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "permission_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_permission_deleted_at" ON "permission" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "role" ("id" text not null, "name" text not null, "description" text null, "guard_name" text not null default 'admin', "is_default" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "role_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_role_deleted_at" ON "role" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "permission" cascade;`);

    this.addSql(`drop table if exists "role" cascade;`);
  }

}
