---
name: medusa-api-route
description: Scaffold a new custom admin/store API route in backend/src/api following this repo's conventions (route.ts handler, zod validation middleware, auth/RBAC wiring). Use when the user asks to add a new backend endpoint, e.g. "add an admin endpoint to manage coupons", "add a store endpoint for X".
---

# Medusa API route scaffold

Adds a new route under `backend/src/api/admin/<name>/` or
`backend/src/api/store/<name>/`, wired the same way as the existing ~25
custom routes in this repo.

## Reference files — read these first

- `backend/src/api/admin/roles/route.ts` — admin route with a service call,
  duplicate-check business logic, validated body/query.
- `backend/src/api/store/catalog/categories/route.ts` — store route using
  `query.graph(...)` directly plus response caching via `../../../../lib/cache`.
- `backend/src/api/middlewares/validation.ts` — every zod schema + the
  `customValidationMiddlewares` array that wires schemas to routes.
- `backend/src/api/middlewares.ts` — top-level middleware registration
  (`defineMiddlewares`), where `/admin/*` gets `authenticate("user", ...)` +
  `rbacMiddleware` globally already.
- `backend/src/api/middlewares/rbac.ts` — how admin permissions are derived
  from the URL path; new admin modules that should be permission-gated must
  be added to the `protectedModules` set here.

## Route handler pattern — `route.ts`

```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { <XBody>, <XQuery> } from "../../middlewares/validation"
import { resolve<X>Service } from "../../../lib/module-services" // if a custom module service is needed
import { ContainerRegistrationKeys } from "@medusajs/framework/utils" // if using query.graph directly

export async function GET(req: MedusaRequest<unknown, <XQuery>>, res: MedusaResponse) {
  const { ...filters } = req.validatedQuery
  // ... fetch via a module service or query.graph
  res.json({ /* plural resource key */ })
}

export async function POST(req: MedusaRequest<<XBody>>, res: MedusaResponse) {
  const body = req.validatedBody
  // ... validate business rules, call service
  res.status(201).json({ /* singular resource key */ })
}
```

Rules, inferred from existing routes:

- Response envelopes use `{ <resource>: ... }` for a single item and
  `{ <resources>: [...], count }` for lists — never a bare array.
- Error responses are `res.status(<code>).json({ error: "..." })` for
  simple 400/409 cases (see `roles/route.ts`), or `{ code, message }` for
  the RBAC-style errors (see `middlewares/rbac.ts`). Match whichever style
  the sibling routes in the same resource family use.
- Use `req.scope.resolve(...)` (directly, or via a small helper in
  `backend/src/lib/module-services.ts` if one already exists for that
  module) to get services — don't import module services as singletons.
- For read endpoints that hit `query.graph` on core Medusa entities and are
  expensive/hit often, check `backend/src/lib/cache.ts` and wrap with
  `cached(cache, CACHE_KEYS.x, TTL.x, fn)` the way `catalog/categories`
  does — only if there's an existing `CACHE_KEYS` entry or the user asks
  for caching; don't add caching speculatively.
- Dynamic segments are folder names like `[id]/route.ts` or
  `[handle]/route.ts`, matching `admin/roles/[id]/route.ts`.

## Validation — add to `backend/src/api/middlewares/validation.ts`

1. Add a `z.object({...})` schema + exported `z.infer` type, named
   `<Thing>BodySchema` / `<Thing>QuerySchema`, placed alphabetically among
   the existing schemas (they're currently in rough alpha order — keep it
   that way).
2. Register it in `customValidationMiddlewares` using the existing
   `bodyRoute(matcher, schema)` / `queryRoute(matcher, schema, method?)`
   helpers at the bottom of the file — do not hand-write a new
   `MiddlewareRoute` object inline.
3. Only add a schema for endpoints that take a body or non-trivial query
   params; a plain `GET` with no query params needs no entry here.

## Auth / RBAC — `backend/src/api/middlewares.ts` + `rbac.ts`

- Everything under `/admin/*` is already authenticated
  (`authenticate("user", ["bearer", "session"])`) and RBAC-checked
  (`rbacMiddleware`) globally — you don't add per-route auth middleware for
  standard admin CRUD.
- If the new admin route's permission checks should be enforced (most
  should), add its URL segment to the `protectedModules` set in
  `backend/src/api/middlewares/rbac.ts`, and decide the
  `permissionModule` name (defaults to the URL segment; special-case it in
  the `permissionModule` ternary if it should map to a different
  permission group, the way `blog-posts`/`chatbot` map to `settings`).
- If the new admin route should be exempt from RBAC (rare — mirror the
  `/admin/users/me` and `/admin/auth` exemptions), leave its segment out of
  `protectedModules`.
- Store routes are public by default. Only add
  `authenticate("customer", ["bearer", "session"], { allowUnauthenticated: true })`
  (or without `allowUnauthenticated` to require login) as an explicit entry
  in `middlewares.ts` if the route needs a logged-in customer — mirror the
  `/store/checkout` and `/store/reviews/:handle` entries.

## Workflow

1. Confirm: admin or store, resource name, whether it needs a body/query
   schema, whether it touches a custom module service or a core Medusa
   entity via `query.graph`, and whether it should be RBAC-protected.
2. Add the zod schema(s) + register in `customValidationMiddlewares`
   (skip if no body/query).
3. Create `backend/src/api/<admin|store>/<name>/route.ts` (and
   `[id]/route.ts` etc. for nested resources) with `GET`/`POST`/`PUT`/`DELETE`
   exports as needed.
4. For admin routes, add the segment to `protectedModules` in `rbac.ts`
   unless it should be unprotected.
5. If the route needs a dedicated per-route middleware (auth, rate limit —
   see `store/chatbot/message/middlewares.ts` for a rate-limit example),
   create `middlewares.ts` next to the route and import/spread it into the
   top-level `defineMiddlewares` in `backend/src/api/middlewares.ts`, the
   way `chatbotMessageMiddlewares` is wired.
6. Don't add tests — this repo has no test suite; don't introduce one
   unprompted.
