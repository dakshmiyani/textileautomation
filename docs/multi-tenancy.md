# Multi-Tenant SaaS Architecture & Implementation Plan

This document outlines the step-by-step strategy to convert the existing single-company Textile ERP into a secure, production-grade Multi-Tenant SaaS. This plan ensures that tenant isolation is maintained as a strict security boundary across the frontend, backend, database, and integrations, without requiring a complete rewrite.

---

## 1. Database & Schema Changes

**New Tables:**
1. `tenants`: `id`, `name`, `slug` (unique), `status` (ACTIVE/SUSPENDED/TRIAL), `email`, `phone`, `address`, `settings`, `timestamps`.
2. `tenant_users`: `id`, `tenant_id`, `user_id`, `role_id`, `status`, `timestamps`. This table replaces the `role_id` column on the `users` table, allowing a single user to belong to multiple tenants with different roles. Unique constraint: `(tenant_id, user_id)`.

**Modified Tables (Adding `tenant_id`):**
The following tables will receive a `tenant_id` column referencing `tenants(id)`:
- `factories`
- `machines`
- `production_records`
- `whatsapp_connections` (will be renamed to `whatsapp_sessions`)
- `whatsapp_messages`
- `audit_logs`
- `orders`
- `customers`

**Safe Migration Sequence:**
1. Add `tenant_id` as *nullable* to the tables above.
2. Create the default initial `Tenant #1` (representing the existing company currently using the ERP).
3. Backfill all existing records with `Tenant #1`'s ID.
4. Migrate user roles into `tenant_users` for `Tenant #1`.
5. Apply `NOT NULL` constraints, foreign keys, and indexes (e.g., `INDEX(tenant_id)`).

---

## 2. Backend Architecture Changes

### Middleware & Context
- A new `tenantContext` middleware will be implemented.
- The frontend will pass a selected `X-Tenant-ID` header.
- The middleware will verify that the authenticated user actually has an active membership in `tenant_users` for that tenant.
- It will safely attach `req.tenant` and `req.tenantMembership` (including the specific role/permissions for that tenant) to the request context.

### Repositories (Strict Isolation)
- All tenant-scoped repositories (`production`, `orders`, `customers`, etc.) will be refactored to explicitly require `tenant_id` in their query parameters.
- **Fail-Safe Mechanism:** Repositories will throw a `TenantContextError` if `tenant_id` is missing, ensuring we fail closed instead of accidentally querying the entire cross-tenant table.

### Controllers & Services
- Controllers will strictly extract `tenant_id` from `req.tenant.id` (set by the secure middleware) and pass it down to services. Payload-provided tenant IDs will be ignored.

---

## 3. WhatsApp & Baileys Multi-Tenancy

- **WhatsAppSessionManager:** We will replace the singleton `whatsapp.connection.js` with a robust `WhatsAppSessionManager` capable of maintaining a map of multiple `BaileysSocket` instances (`Map<sessionId, socket>`).
- **Dynamic Auth Storage:** Baileys auth state will be stored in dynamic folders: `/data/whatsapp-auth/<session_key>/`. This ensures complete isolation of credentials.
- **Tenant Routing:** When a message arrives via a Baileys socket, the event is inherently tied to a specific `session_key`. The backend will lookup the associated `tenant_id` from `whatsapp_sessions` and strictly inject it into the parser and `production.service.js`.

---

## 4. Frontend Enhancements

- **TenantProvider Context:** A reusable React context will store the currently active tenant.
- **Tenant Switcher:** If a user belongs to multiple tenants, a dropdown will allow them to switch contexts safely.
- **API Interceptor:** Axios will automatically append the `X-Tenant-ID` header to all outgoing requests.
- **Dashboard & Scoped Data:** All KPIs, charts, and lists will naturally reflect only the data of the active tenant, driven by the isolated backend responses.

---

## 5. Security & Isolation Guarantee

- **Fail-Closed Queries:** Missing tenant context results in a hard failure, not an unscoped query.
- **Cross-Tenant Attack Prevention:** If Tenant A attempts to update a record belonging to Tenant B, the scoped repository query (`WHERE id = ? AND tenant_id = ?`) will safely return a 404 Not Found.
- **Export Isolation:** ExcelJS exports will dynamically filter records by `req.tenant.id` before generating the workbook, preventing data leaks.
- **Redis Namespace:** All caching and duplicate-checking logic will prefix keys with `tenant:{tenant_id}:`.

---

## 6. Execution Strategy

If approved, the execution will follow this order:
1. Generate and run Knex migrations (create `tenants`, `tenant_users`, backfill data, add `tenant_id` to entities).
2. Refactor `auth.middleware.js` and `user` repositories.
3. Refactor entity repositories and services to enforce `tenant_id`.
4. Refactor WhatsApp integration to `WhatsAppSessionManager`.
5. Refactor the frontend (Context, Interceptors, Switcher).
6. Implement and verify strict security tests.
