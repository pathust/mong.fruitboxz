import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260707090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "site_review" (
        "id" text not null,
        "handle" text not null,
        "product_id" text null,
        "customer_id" text not null,
        "rating" integer not null,
        "comment" text null,
        "approved" boolean not null default true,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "site_review_pkey" primary key ("id")
      );
    `)
    this.addSql(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'site_review_rating_check'
        ) then
          alter table "site_review"
            add constraint "site_review_rating_check"
            check ("rating" between 1 and 5 and "rating" = trunc("rating"));
        end if;
      end $$;
    `)
    this.addSql(`create index if not exists "IDX_site_review_deleted_at" on "site_review" ("deleted_at") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_site_review_handle_approved_created_at" on "site_review" ("handle", "approved", "created_at" desc) where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_site_review_customer_id" on "site_review" ("customer_id") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_site_review_product_id" on "site_review" ("product_id") where "deleted_at" is null and "product_id" is not null;`)

    this.addSql(`alter table if exists "site_blog_post" drop constraint if exists "site_blog_post_category_id_fkey";`)
    this.addSql(`
      do $$
      begin
        if not exists (
          select 1
          from "site_blog_category"
          where "deleted_at" is null
          group by "slug"
          having count(*) > 1
        ) then
          create unique index if not exists "IDX_site_blog_category_slug_unique"
            on "site_blog_category" ("slug")
            where "deleted_at" is null;
        end if;
      end $$;
    `)
    this.addSql(`create index if not exists "IDX_site_banner_active_order" on "site_banner" ("active", "order") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_site_blog_post_published_dates" on "site_blog_post" ("published", "published_at" desc, "created_at" desc) where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_site_chatbot_question_log_resolved_created_at" on "site_chatbot_question_log" ("resolved", "created_at" desc) where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_site_contact_message_status_created_at" on "site_contact_message" ("status", "created_at" desc) where "deleted_at" is null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_site_contact_message_status_created_at";`)
    this.addSql(`drop index if exists "IDX_site_chatbot_question_log_resolved_created_at";`)
    this.addSql(`drop index if exists "IDX_site_blog_post_published_dates";`)
    this.addSql(`drop index if exists "IDX_site_banner_active_order";`)
    this.addSql(`drop index if exists "IDX_site_blog_category_slug_unique";`)
    this.addSql(`drop index if exists "IDX_site_review_product_id";`)
    this.addSql(`drop index if exists "IDX_site_review_customer_id";`)
    this.addSql(`drop index if exists "IDX_site_review_handle_approved_created_at";`)
    this.addSql(`drop index if exists "IDX_site_review_deleted_at";`)
    this.addSql(`alter table if exists "site_review" drop constraint if exists "site_review_rating_check";`)
    this.addSql(`drop table if exists "site_review" cascade;`)
  }
}
