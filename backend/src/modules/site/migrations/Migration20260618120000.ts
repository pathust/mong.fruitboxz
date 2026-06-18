import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260618120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      do $$
      begin
        if exists (select 1 from pg_available_extensions where name = 'vector') then
          create extension if not exists vector;
        else
          raise notice 'pgvector extension is not installed on this PostgreSQL server';
        end if;
      end $$;
    `);

    this.addSql(`create index if not exists "IDX_fulfillment_delivery_address_id" on "fulfillment" ("delivery_address_id");`);
    this.addSql(`create index if not exists "IDX_fulfillment_provider_id" on "fulfillment" ("provider_id");`);
    this.addSql(`create index if not exists "IDX_order_line_item_totals_id" on "order_line_item" ("totals_id");`);

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
    `);

    this.addSql(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'site_contact_message_status_check'
        ) then
          alter table "site_contact_message"
            add constraint "site_contact_message_status_check"
            check ("status" in ('new', 'read', 'resolved', 'archived'));
        end if;
      end $$;
    `);

    this.addSql(`
      create unique index if not exists "IDX_site_setting_active_key_unique"
        on "site_setting" ("key")
        where "deleted_at" is null;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_site_setting_active_key_unique";`);
    this.addSql(`alter table if exists "site_contact_message" drop constraint if exists "site_contact_message_status_check";`);
    this.addSql(`alter table if exists "site_review" drop constraint if exists "site_review_rating_check";`);
    this.addSql(`drop index if exists "IDX_order_line_item_totals_id";`);
    this.addSql(`drop index if exists "IDX_fulfillment_provider_id";`);
    this.addSql(`drop index if exists "IDX_fulfillment_delivery_address_id";`);
  }

}
