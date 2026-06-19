import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260617082647 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "site_blog_post" add column if not exists "category_id" text null;`)
    this.addSql(`
      update "site_blog_post" post
      set "category_id" = category."id"
      from "site_blog_category" category
      where post."category_id" is null
        and post."category" is not null
        and (
          lower(trim(post."category")) = lower(trim(category."name"))
          or lower(trim(post."category")) = lower(trim(category."slug"))
        );
    `)
    this.addSql(`alter table if exists "site_blog_post" drop column if exists "category";`)
    this.addSql(`
      alter table if exists "site_blog_post"
      add constraint "site_blog_post_category_id_foreign"
      foreign key ("category_id") references "site_blog_category" ("id")
      on update cascade on delete set null;
    `)
    this.addSql(`create index if not exists "IDX_site_blog_post_category_id" on "site_blog_post" ("category_id") where deleted_at is null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "site_blog_post" add column if not exists "category" text null;`)
    this.addSql(`
      update "site_blog_post" post
      set "category" = category."name"
      from "site_blog_category" category
      where post."category_id" = category."id";
    `)
    this.addSql(`alter table if exists "site_blog_post" drop constraint if exists "site_blog_post_category_id_foreign";`)
    this.addSql(`drop index if exists "IDX_site_blog_post_category_id";`)
    this.addSql(`alter table if exists "site_blog_post" drop column if exists "category_id";`)
  }
}
