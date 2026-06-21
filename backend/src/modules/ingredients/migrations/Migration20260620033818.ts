import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260620033818 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ingredient" drop column if exists "stock_quantity";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "ingredient" add column if not exists "stock_quantity" integer not null default 0;`);
  }

}
