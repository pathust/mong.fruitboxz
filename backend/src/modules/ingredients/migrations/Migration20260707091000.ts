import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260707091000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      do $$
      begin
        if to_regclass('public.recipe_item') is not null then
          create index if not exists "IDX_recipe_item_variant_id"
            on "recipe_item" ("variant_id")
            where "deleted_at" is null;
        end if;
      end $$;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_recipe_item_variant_id";`)
  }
}
