import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260620011115 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ingredient" ("id" text not null, "name" text not null, "sku" text null, "stock_quantity" integer not null default 0, "unit" text not null default 'piece', "cost_price" integer null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ingredient_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ingredient_deleted_at" ON "ingredient" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "recipe_item" ("id" text not null, "variant_id" text not null, "quantity" integer not null default 1, "ingredient_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recipe_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recipe_item_ingredient_id" ON "recipe_item" ("ingredient_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recipe_item_deleted_at" ON "recipe_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "recipe_item" add constraint "recipe_item_ingredient_id_foreign" foreign key ("ingredient_id") references "ingredient" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "recipe_item" drop constraint if exists "recipe_item_ingredient_id_foreign";`);

    this.addSql(`drop table if exists "ingredient" cascade;`);

    this.addSql(`drop table if exists "recipe_item" cascade;`);
  }

}
