import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260530132915 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "site_recipe_item" drop constraint if exists "site_recipe_item_ingredient_id_foreign";`);

    this.addSql(`drop table if exists "site_ingredient" cascade;`);

    this.addSql(`drop table if exists "site_recipe_item" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "site_ingredient" ("id" text not null, "name" text not null, "sku" text null, "unit" text not null, "cost_per_unit" integer not null, "category" text not null default 'Fruit', "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_ingredient_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_ingredient_deleted_at" ON "site_ingredient" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "site_recipe_item" ("id" text not null, "variant_id" text not null, "quantity" integer not null, "ingredient_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_recipe_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_recipe_item_ingredient_id" ON "site_recipe_item" ("ingredient_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_recipe_item_deleted_at" ON "site_recipe_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "site_recipe_item" add constraint "site_recipe_item_ingredient_id_foreign" foreign key ("ingredient_id") references "site_ingredient" ("id") on update cascade;`);
  }

}
