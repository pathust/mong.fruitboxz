import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260527145518 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "role" add column if not exists "permissions" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "role" drop column if exists "permissions";`);
  }

}
