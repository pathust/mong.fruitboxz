import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260616093000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "site_blog_post" ("id" text not null, "title" text not null, "slug" text not null, "excerpt" text null, "content" text null, "image" text null, "author" text null, "category" text null, "published" boolean not null default true, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_blog_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_blog_post_deleted_at" ON "site_blog_post" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_site_blog_post_slug_unique" ON "site_blog_post" ("slug") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "site_blog_post" cascade;`);
  }

}
