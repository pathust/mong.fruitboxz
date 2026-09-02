---
name: docs-sync
description: Update the docs/ domain documentation (01-auth, 02-products, 03-cart-checkout, 04-orders, 05-admin, 06-marketing, 07-finance, 08-system, 09-testing) after backend API/module changes, so docs stay in sync with the actual implementation. Use after adding/changing a route, module, or auth/RBAC behavior, or when asked to "update the docs" for a backend change.
---

# Docs sync

`docs/` is organized by domain, each with a `README.md` (and sometimes
extra files like `flows.md`, `status-machine.md`, `rbac.md`):

```
docs/00-overview.md          # tech stack, architecture diagram (mermaid)
docs/01-auth/README.md       # + flows.md
docs/02-products/README.md   # + status-machine.md
docs/03-cart-checkout/README.md  # + data-flow.md
docs/04-orders/README.md     # + status-machine.md
docs/05-admin/README.md      # + rbac.md
docs/06-marketing/README.md
docs/07-finance/README.md
docs/08-system/README.md
docs/09-testing/            # test-plan.md, e2e-scenarios.md
```

These docs describe endpoints, request/response shapes, data models, and
edge-case tables (see `docs/01-auth/README.md` for the reference style:
endpoint + curl-able JSON body/response, a data model table, an "Edge
Cases & Validation" table, and a "Liên kết" section linking related docs).
**They are written in Vietnamese** — match that.

## When to update which file

| Change made | File(s) to update |
|---|---|
| New/changed route under `/auth/*`, `/admin/login`, `/admin/users/*` auth | `docs/01-auth/README.md`, `flows.md` |
| New/changed route under `/store/catalog/*`, `/admin/products*`, `/store/search*` | `docs/02-products/README.md` |
| New/changed route under `/store/checkout*`, `/store/session-cart/*`, `/store/promotions/*` | `docs/03-cart-checkout/README.md`, `data-flow.md` |
| New/changed route under `/admin/custom/orders/*`, order status changes | `docs/04-orders/README.md`, `status-machine.md` |
| New/changed admin route, new RBAC permission/module in `middlewares/rbac.ts`'s `protectedModules` | `docs/05-admin/README.md`, `rbac.md` |
| New/changed `/admin/banners`, `/admin/blog-*`, `/admin/promotions*` | `docs/06-marketing/README.md` |
| Anything payment/shipping-quote/finance-adjacent | `docs/07-finance/README.md` |
| New module registered in `medusa-config.ts`, infra change (Docker, env vars) | `docs/08-system/README.md` |
| New test scenario, or a change that alters an existing documented flow | `docs/09-testing/e2e-scenarios.md`, `test-plan.md` |
| Any change to the module list, tech stack, or top-level architecture | `docs/00-overview.md` (mermaid diagram + tech stack table) |

If a change spans domains (e.g. a new RBAC-protected admin route for a new
module), update every relevant file — don't just pick one.

## How to write the update — match reality, not aspiration

Before editing a doc, read the actual current code for what you're
documenting (the route handler, the zod schema in
`backend/src/api/middlewares/validation.ts`, the model). These docs were
found to already contain some idealized/generic shapes that don't exactly
match the real code (e.g. described response envelopes that differ from
what a handler actually returns) — don't propagate more of that. Copy the
**real** request/response shape, the **real** validation rules (from the
zod schema, not guessed), and the **real** error codes.

For a new endpoint, add a subsection following the existing format exactly:

```markdown
### N.M <Short title>

**Endpoint**: `<METHOD> /path`

**Request Body**:
​```json
{ ... real shape from the zod schema ... }
​```

**Response** (`<status>`):
​```json
{ ... real shape from the handler ... }
​```

**Validation rules**:
- `<field>`: <rule, taken from the zod schema>
```

For a new edge case, add a row to the existing "Edge Cases & Validation"
table rather than a new section, unless the domain doc doesn't have one yet.

For RBAC changes specifically (`docs/05-admin/rbac.md`), keep it in sync
with the actual `protectedModules` set and `permissionModule` mapping in
`backend/src/api/middlewares/rbac.ts` — this is the single most
important doc to not let drift, since it's the security reference.

## Workflow

1. Identify what changed (route, module, auth rule) — if not already clear
   from context, `git diff` to see the actual change.
2. Map it to the domain doc(s) via the table above.
3. Read the current doc section being touched, and the real
   implementation (route handler + validation schema + any relevant
   middleware).
4. Edit the doc to match reality — update existing sections in place rather
   than duplicating; add new subsections following the existing structure
   and numbering.
5. If the change affects `docs/00-overview.md`'s architecture diagram
   (new module, new external service), update the mermaid graph too, not
   just the tech stack table.
6. Don't invent documentation for behavior that doesn't exist yet — if
   asked to document a planned-but-unbuilt feature, say so explicitly
   rather than writing it as if implemented.
