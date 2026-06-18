import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260618120100 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      create unique index if not exists "IDX_permission_active_name_guard_unique"
        on "permission" ("name", "guard_name")
        where "deleted_at" is null;
    `);

    this.addSql(`
      create unique index if not exists "IDX_role_active_name_guard_unique"
        on "role" ("name", "guard_name")
        where "deleted_at" is null;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_role_active_name_guard_unique";`);
    this.addSql(`drop index if exists "IDX_permission_active_name_guard_unique";`);
  }

}
