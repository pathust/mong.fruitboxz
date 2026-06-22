# Architectural Review: Mọng Fruitboxz

## 1. DATA FLOW INCONSISTENCIES
- **Location:** `backend/src/api/store/checkout/route.ts`
- **Problem:** Business logic for proportional discount allocation and validation is hardcoded directly inside the POST route handler. It bypasses the Medusa Workflows/Service layer.
- **Impact:** Maintainability. Duplicated logic if orders are created elsewhere (e.g. Draft Orders via Admin). Hard to test route handlers compared to isolated services.
- **Recommended Fix:** Extract the checkout logic into a dedicated `@medusajs/workflows` workflow (`checkoutWorkflow`) or a dedicated Service that orchestrates the core modules.

## 2. AUTHENTICATION & AUTHORIZATION
- **Location:** `backend/src/api/middlewares.ts`
- **Problem:** Admin routes are protected using explicit path matchers (e.g., `/admin/products*`, `/admin/users*`) rather than a catch-all `/admin/*`. As a result, endpoints like `/admin/blog-categories` are completely unprotected.
- **Impact:** Security (Critical). Unauthenticated users can perform CRUD operations on unprotected admin endpoints.
- **Recommended Fix:** Change the matcher in `middlewares.ts` to use a global catch-all `{ matcher: "/admin/*", middlewares: [authenticate("user", ...), rbacMiddleware] }`, and explicitly skip auth for specific routes (like `/admin/auth`) if needed.

## 3. MODULE BOUNDARIES
- **Location:** `backend/src/api/store/checkout/route.ts`
- **Problem:** The route manually resolves multiple core modules (`Modules.ORDER`, `Modules.PROMOTION`) and coordinates them. While `query.graph` is used elsewhere for reading, writing across modules inside an API route tightly couples the route to internal schemas.
- **Impact:** Maintainability and scalability. Breaks the modular architecture principles of Medusa v2.
- **Recommended Fix:** Encapsulate the order creation process inside a `@medusajs/workflows` workflow that orchestrates the promotion and order modules.

## 4. STOREFRONT vs CMS DUPLICATION
- **Location:** `frontend/src/App.jsx`
- **Problem:** The admin dashboard and the frontend are bundled in the exact same Vite SPA. Admin components (`AdminLayout.jsx`) and frontend components share the same build process, meaning customer browsers download admin panel code and routes.
- **Impact:** Security/Performance. Admin source code map/bundle is shipped to public users, exposing the admin routing structure and increasing bundle size.
- **Recommended Fix:** Separate the Admin SPA from the Frontend SPA. Configure Vite to use multi-page app (MPA) mode with separate entry points (e.g., `index.html` and `admin.html`).

## 5. CHATBOT INTEGRATION
- **Location:** `backend/src/lib/chatbot.ts`
- **Problem:** The chatbot is touted as "Groq/RAG" but is actually implemented as a simple static keyword matcher (`scoreFaqMatch`) and basic Meilisearch query fallback. There is no LLM integration or RAG context scoping.
- **Impact:** UX. Fails to provide contextual, natural language responses. False advertising of system capabilities.
- **Recommended Fix:** Implement the Groq SDK. Introduce a vector database (e.g., `pgvector`) to index product descriptions and policies, then query it before calling Groq to generate the final response (actual RAG).

## 6. SHIPPING (OSRM) MODULE
- **Location:** `backend/src/lib/geocoding.ts`
- **Problem:** The "OSRM" shipping calculation actually uses a synchronous Haversine (straight-line) distance formula (`haversineKm`) instead of actual road-network routing via OSRM.
- **Impact:** UX/Business Logic. Customers could be undercharged for shipping if a straight line crosses a lake or river, but the actual driving distance is much longer.
- **Recommended Fix:** Replace `haversineKm` with an asynchronous HTTP call to an OSRM instance to calculate driving distance, and add Redis caching for the specific `[origin]-[destination]` pairs to prevent rate-limiting/blocking.

## 7. NOTIFICATIONS MODULE
- **Location:** `backend/src/subscribers/order-placed.ts`
- **Problem:** The notification system is just a `TODO` comment stub that logs to console. It doesn't actually integrate with any provider (Email/In-app).
- **Impact:** UX. Customers do not receive order confirmation emails.
- **Recommended Fix:** Implement a proper Notification Provider module (e.g., Resend or Sendgrid) using Medusa's Notification Module API and trigger it from the `order.placed` event.

---

### TOP 5 HIGHEST-IMPACT FIXES TO DO IMMEDIATELY
1. **Fix the Admin Auth Middleware** to use a catch-all `/admin/*` to plug the critical security hole on `/admin/blog-categories` and future routes.
2. **Implement actual Groq LLM integration** in `chatbot.ts` to fulfill the RAG requirement.
3. **Replace the Haversine distance** in `geocoding.ts` with a real OSRM/Routing API call with caching.
4. **Move business logic from `checkout/route.ts`** into a Service/Workflow to fix data flow inconsistencies.
5. **Implement Notification module** for order confirmations (Resend/Sendgrid) in `order-placed.ts`.
