# Textile ERP — System Architecture

## 1. Architectural Philosophy

Textile ERP is designed from the ground up as a **modular, enterprise-grade business suite**. The system begins with automated **WhatsApp-based yarn production data collection** and scales horizontally across all facets of a modern textile enterprise (Warping, Sizing, Weaving, Inventory, CRM, Purchasing, Maintenance, and Finance).

### Core Design Rules
1. **Modules, Not Screens**: Systems are designed as self-contained domain modules rather than ad-hoc views.
2. **Thin Controllers**: Controllers only parse HTTP input, invoke validation, call services, and return normalized responses.
3. **Domain Business Logic in Services**: All calculations, validations, event publications, and audit logs live exclusively in services.
4. **Database Abstraction via Repositories**: Knex.js repositories isolate all SQL queries. Services remain database-agnostic.
5. **Decoupled Integrations**: External systems (WhatsApp Baileys, ExcelJS, Email, Storage) are encapsulated in dedicated adapters.
6. **Feature-Driven Frontend**: Frontend logic (`api.js`, `hooks.js`, `schemas.js`, `components/`) resides in `client/src/features/<module>/` to keep pages lightweight.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                  │
│  React 18 + Vite + Tailwind CSS + TanStack Query + React Hook Form     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP / REST /api/v1 (JWT)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                   │
│                 Node.js + Express.js Modular Engine                    │
│                                                                        │
│   Routes ──► Controller ──► Service ──► Repository ──► PostgreSQL      │
│                                │                                       │
│                                ├──► EventBus (In-Memory / Redis ready) │
│                                ├──► AuditService                       │
│                                └──► Integrations                       │
│                                        ├── WhatsApp (Baileys)          │
│                                        ├── Excel (ExcelJS)             │
│                                        └── Storage                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout

```
textile-erp/
│
├── client/                     # React + Vite Frontend Dashboard
│   ├── src/
│   │   ├── app/                # App entry, router, providers, queryClient
│   │   ├── components/         # Common UI design system components
│   │   ├── layouts/            # DashboardLayout (RBAC sidebar), AuthLayout
│   │   ├── features/           # Feature domain logic (api, hooks, schemas)
│   │   ├── pages/              # Clean routed page views
│   │   ├── services/           # Centralized Axios apiClient
│   │   └── store/              # Lightweight auth & UI state
│
├── server/                     # Express.js Backend Monolith
│   ├── src/
│   │   ├── config/             # Zod env validation, pino logger
│   │   ├── database/           # Knex instance, migrations, seeds
│   │   ├── middleware/         # Auth, RBAC, error handling, rate limiting
│   │   ├── modules/            # Standardized ERP modules (auth, production, whatsapp, audit)
│   │   ├── integrations/       # WhatsApp Baileys, ExcelJS exports
│   │   ├── jobs/               # Background queue & async workers
│   │   └── utils/              # EventBus, formatting helpers
│   └── storage/                # WhatsApp auth credentials, export files
│
├── docs/                       # Architecture, DB, API & Deployment guides
├── scripts/                    # setup.sh, seed.sh automation
├── docker/                     # Dockerfiles & PostgreSQL init
├── docker-compose.yml          # PostgreSQL 16 + Redis + App containerization
└── package.json                # Root workspaces dev launcher
```

---

## 3. Dependency Flow

All backend business domains follow a strict directional hierarchy:

```text
HTTP Request
     ↓
validation.middleware.js (Zod Schema Validation)
     ↓
module.controller.js (Thin HTTP translation)
     ↓
module.service.js (Business rules, audit logging, events)
     ↓
module.repository.js (Knex SQL queries with parameterization)
     ↓
PostgreSQL Database
```

---

## 4. Multi-Factory Hierarchy

To scale from a single weaving unit to an industrial textile conglomerate, the data model supports multi-tier tenancy:

```
Company (Enterprise Entity)
   └── Factory (Mill / Unit Location)
          └── Loom Shed / Department
                 └── Machine (e.g., Air-jet Loom, Rapier Loom)
                        └── Production Records
```
Every production record stores foreign keys to `company_id`, `factory_id`, and `machine_id` allowing global multi-site consolidation or single-loom drill-downs.

---

## 5. Event-Driven Preparedness

The system provides an internal `AppEventBus` (`server/src/utils/eventBus.js`). When a production record is created or a WhatsApp message arrives:
1. `production.service.js` emits `EVENTS.PRODUCTION_CREATED`.
2. Asynchronous subscribers (inventory deductions, notifications, analytics recomputations) consume the event without blocking the client response or WhatsApp worker.
3. For horizontal multi-instance scaling, the internal EventBus is designed to drop-in swap with BullMQ / Redis or RabbitMQ without modifying service code.
