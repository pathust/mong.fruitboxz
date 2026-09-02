---
name: medusa-module-scaffold
description: Scaffold a new custom Medusa v2 module in backend/src/modules following this repo's conventions (model, service, index, migration, medusa-config.ts registration). Use when the user asks to add a new domain/module to the backend, e.g. "add a wishlist module", "create a loyalty-points module".
disable-model-invocation: true
---

# Medusa module scaffold

Creates a new custom module under `backend/src/modules/<name>/`, matching the
pattern used by the existing modules (`voting`, `rbac`, `bulk_orders`,
`ingredients`, `shipping`, `site`).

## Reference: existing conventions

Look at `backend/src/modules/voting/` (simple, single-model module) and
`backend/src/modules/rbac/` (multi-model module with migrations) before
generating anything — mirror their exact style, not just the shape below.

### 1. Model — `models/<entity>.ts`

```ts
import { model } from "@medusajs/framework/utils"

export const Vote = model.define("vote", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  product_id: model.text(),
  score: model.number(),
  comment: model.text().nullable(),
})
```

- Table/model name (`"vote"`) is snake_case singular.
- Export as a named export for a single-model module; use `models/index.ts`
  re-exporting each model (see `rbac/models/index.ts`) when there are
  multiple models in one module.
- Use `model.text()`, `model.number()`, `model.boolean()`, `model.json()`,
  `model.dateTime()` etc. Use `.nullable()` / `.default(...)` as needed —
  never invent field types not used elsewhere in the codebase without
  checking the Medusa docs (use context7 for `@medusajs/framework` if unsure).

### 2. Service — `service.ts`

```ts
import { MedusaService } from "@medusajs/framework/utils"
import { Vote } from "./models/vote"

class VotingService extends MedusaService({
  Vote,
}) {}

export default VotingService
```

- One `MedusaService({...})` per module, listing every model. This
  auto-generates `list<Model>`, `listAndCount<Model>`, `create<Model>`,
  `update<Model>`, `delete<Model>` methods — do NOT hand-write basic CRUD
  unless the module needs custom business logic beyond that (add extra
  methods on the class body in that case, see `rbac/service.ts` for a
  richer example).

### 3. Module definition — `index.ts`

```ts
import { Module } from "@medusajs/framework/utils"
import VotingService from "./service"

export default Module("voting", {
  service: VotingService,
})
```

- First arg to `Module(...)` is the module key, snake_case, matches the
  directory name.

### 4. Register in `backend/medusa-config.ts`

Add to the `modules` array:

```ts
{
  resolve: "./src/modules/<name>",
},
```

Follow the existing entries' placement/order (after the built-in
`@medusajs/*` modules, alongside `rbac`, `site`, `bulk_orders`, etc.).

### 5. Migration (only if adding to an EXISTING module with data already in prod, or when the model needs an index/constraint the model DSL can't express)

For a brand-new module, Medusa generates the migration automatically the
first time the dev server boots (`medusa develop` runs migrations for new
modules). Do NOT hand-write a create-table migration for a new module.

Only hand-write a migration (see
`backend/src/modules/rbac/migrations/Migration20260618120100.ts`) when you
need something the model DSL doesn't cover, e.g. a partial unique index:

```ts
import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration<YYYYMMDDHHmmss> extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create unique index if not exists "IDX_<table>_<cols>_unique"
        on "<table>" ("<col1>", "<col2>")
        where "deleted_at" is null;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_<table>_<cols>_unique";`);
  }
}
```

Name the file `Migration<UTC timestamp as YYYYMMDDHHmmss>.ts` matching the
current time, mirroring the existing files in `rbac/migrations/`.

## Workflow

1. Ask (if not already given): module name, its model(s) and fields, whether
   it needs links to core Medusa entities (e.g. `product`, `customer`) via
   `defineLink` (see `backend/src/links/` and `backend/README.md` "Module
   Links" section) or custom API routes (point to the `medusa-api-route`
   skill for that part).
2. Create `backend/src/modules/<name>/models/<entity>.ts` for each model.
3. Create `backend/src/modules/<name>/service.ts`.
4. Create `backend/src/modules/<name>/index.ts`.
5. Add the module to `backend/medusa-config.ts`.
6. If the module links to a core entity, scaffold the link file too (mirror
   an existing file under `backend/src/links/`).
7. Tell the user to run the backend once (`docker compose restart backend`
   or `npm run dev` inside `backend/`) so Medusa generates and applies the
   migration for the new tables, and to check `backend/src/modules/<name>/migrations/`
   for the generated file.
8. Do not write tests or docs beyond what's asked — this repo has no test
   suite; don't introduce one unprompted.
