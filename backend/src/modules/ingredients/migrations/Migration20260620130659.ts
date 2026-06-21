import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260620130659 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ingredient" drop column if exists "sku";`);

    this.addSql(`alter table if exists "ingredient" add column if not exists "type" text check ("type" in ('fruit', 'dip_sauce', 'mix_sauce', 'yogurt', 'other')) not null default 'other';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "ingredient" drop column if exists "type";`);

    this.addSql(`alter table if exists "ingredient" add column if not exists "sku" text null;`);
  }

}
