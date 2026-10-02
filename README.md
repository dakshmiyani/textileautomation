# 🏭 Textile ERP — Scalable Full-Stack Architecture

> A production-grade **Textile Enterprise Resource Planning (ERP)** system built with a modular monorepo architecture. It automates WhatsApp yarn production data collection via Baileys, records telemetry in PostgreSQL via Knex repositories, provides rich real-time ERP analytics dashboards, and streams styled Excel exports.

---

## 🚀 Key Highlights

* **Monorepo Architecture**: Clean separation between `client/` (React + Vite) and `server/` (Node.js + Express + PostgreSQL).
* **WhatsApp Ingestion Gateway**: Built with `@whiskeysockets/baileys` multi-file session authentication.
  - Automatically parses yarn production messages (`Yarn`, `Ends`, `Meter`, `Panna`, `Total Beam`).
  - Strict format enforcement: non-production conversations are silently ignored.
  - Instant duplicate detection (grace window & message ID cache).
  - Resolves real phone numbers (avoiding WhatsApp privacy LIDs `@lid`) and phone address book contact names.
  - Sends immediate `"ok"` reply only upon successful database persistence.
* **Database & Repository Pattern**: PostgreSQL managed via Knex.js migrations and seeds. Repositories isolate SQL queries; zero database code in controllers. Includes automatic SQLite fallback for zero-dependency local runs.
* **ExcelJS Export Engine**: Generates styled `.xlsx` workbooks with corporate navy headers, formatted decimals, and dynamic formula total rows (`SUM`, `AVERAGE`).
* **Enterprise Security & RBAC**:
  - JWT Access & Refresh Token rotation.
  - 6 Predefined Roles (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SUPERVISOR`, `OPERATOR`, `VIEWER`).
  - 14 Granular Permissions driving UI navigation and backend route guards.
  - Password hashing with bcrypt (10 rounds).
  - Centralized immutable audit logs (`audit_logs` table).
* **Modern ERP Dashboard**:
  - Recharts KPI trends (daily meters manufactured, yarn count distribution).
  - Live metric cards (Today's Meters, Today's Beams, Active Loom Shed Units, WhatsApp Submissions).
  - Full-featured data table with server pagination, sorting, search, and manual entry modal.

---

## 🛠️ Technology Stack

| Domain | Technology |
| ------ | ---------- |
| **Backend** | Node.js, Express.js, PostgreSQL, Knex.js, Baileys (`@whiskeysockets/baileys`), ExcelJS, JWT, bcryptjs, Zod, Pino |
| **Frontend** | React 18, Vite, Tailwind CSS, TanStack Query v5, React Router v6, React Hook Form, Zod, Recharts, Lucide Icons |
| **DevOps** | Docker, Docker Compose, Nginx, Shell Scripts |

---

## 📁 Monorepo Structure

```text
textile-erp/
│
├── client/                     # React + Vite Frontend ERP Dashboard
│   ├── src/
│   │   ├── app/                # App entry, router, providers, queryClient
│   │   ├── components/         # Reusable ERP UI components
│   │   ├── features/           # Feature logic (api, hooks, schemas, tables)
│   │   ├── layouts/            # DashboardLayout (RBAC navigation), AuthLayout
│   │   ├── pages/              # Routed views (Dashboard, Production, WhatsApp, etc.)
│   │   └── services/           # Centralized Axios apiClient with JWT refresh
│
├── server/                     # Express.js Modular Backend Engine
│   ├── src/
│   │   ├── config/             # Zod environment validation, logger
│   │   ├── database/           # Knex instance, migrations, seeds
│   │   ├── middleware/         # Auth, RBAC, error handling, rate limiting
│   │   ├── modules/            # Standardized ERP modules (auth, production, whatsapp, audit)
│   │   ├── integrations/       # WhatsApp Baileys, ExcelJS exports
│   │   ├── jobs/               # Background queue & async workers
│   │   └── routes/             # Versioned /api/v1 routes
│   └── storage/                # WhatsApp auth credentials, exports, SQLite cache
│
├── docs/                       # Comprehensive documentation suite
│   ├── architecture.md         # High-level architecture & domain boundaries
│   ├── database.md             # Complete schema, tables, and multi-factory model
│   ├── api.md                  # Versioned /api/v1 API reference
│   ├── authentication.md       # RBAC matrix and JWT mechanics
│   ├── whatsapp.md             # Baileys gateway and parser specification
│   ├── production.md           # Production telemetry and Excel export engine
│   ├── deployment.md           # Docker and bare-metal production deployment
│   └── contributing.md         # Step-by-step guide for adding new ERP modules
│
├── docker/                     # Dockerfiles and Postgres initialization
├── docker-compose.yml          # Containerized PostgreSQL, Redis, Server & Client
├── scripts/                    # setup.sh and seed.sh automation
├── package.json                # Workspaces root package configuration
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL (or use the built-in SQLite auto-fallback mode for local dev)

### 1. Install & Setup
Run the automated setup script:
```bash
./scripts/setup.sh
```

Or install manually:
```bash
# Install all root workspaces dependencies
npm install

# Run database migrations and seeds
npm run migrate --workspace=server
npm run seed --workspace=server
```

### 2. Start Development Servers
```bash
npm run dev
```
This runs both the backend API server (`http://localhost:5000`) and the Vite client application (`http://localhost:5173`) concurrently.

---

## 🔑 Default Administrator Credentials

When the database is seeded, a default administrative account is provisioned:

* **Email**: `admin@textileerp.com`
* **Password**: `Admin@123`
* **Role**: `SUPER_ADMIN` (granted all 14 permissions)

*(A convenient "Auto-fill" button is also provided on the `/login` screen).*

---

## 📱 WhatsApp Message Contract

When operators or weavers send production details via WhatsApp to the paired Baileys gateway:

```text
Yarn: 40s
Ends: 1200
Meter: 5000
Panna(beam width): 63
Total beam: 10
```

### Processing Logic:
1. **Format Validation**: Ensures all 5 fields are present and numeric values (`Ends`, `Meter`, `Panna`, `Total Beam`) are strictly positive numbers.
2. **Duplicate Check**: Prevents duplicate entries using a 3-minute grace period and unique message ID caching.
3. **Database Insertion**: Saves the batch directly to `production_records` in PostgreSQL.
4. **Dashboard Live Update**: Emits event so React Dashboard reflects the new batch immediately.
5. **WhatsApp Reply**: Sends back `"ok"`.
6. **Privacy Rule**: Normal chat conversations are silently ignored with zero replies sent.

---

## 🧪 Running the Backend Test Suite

Run the comprehensive test suite verifying the parser, validator, duplicate detector, auth tokens, database migrations, production calculations, Excel generation, and HTTP routes:

```bash
npm test
```

Expected output:
```text
========================================
🧪 RUNNING TEXTILE ERP BACKEND TESTS
========================================
  ✅ PASS: Standard yarn production message format
  ✅ PASS: Flexible casing, spacing, and aliases
  ✅ PASS: Non-production conversation must be rejected (null)
  ✅ PASS: Valid numeric conversion and bounds
  ✅ PASS: Invalid or negative numbers fail validation
  ✅ PASS: Duplicate message IDs within grace window are caught
  ✅ PASS: Database connection and migration sync
  ✅ PASS: Admin login with seeded credentials and JWT issuance
  ✅ PASS: Invalid credentials throw AuthenticationError
  ✅ PASS: Create production record and verify persistence
  ✅ PASS: Retrieve production record by ID and calculate KPIs
  ✅ PASS: Generate styled Excel workbook buffer from records
  ✅ PASS: GET /api/v1/health returns 200 OK
  ✅ PASS: POST /api/v1/auth/login logs in and returns tokens
  ✅ PASS: GET /api/v1/production with valid JWT token returns paginated list
  ✅ PASS: GET /api/v1/production without token is rejected with 401
========================================
📊 TEST RESULTS: 16 PASSED, 0 FAILED
========================================
```

---

## 🐳 Docker Production Deployment

To run the entire system with Docker Compose:

```bash
docker compose up -d --build
```

Services started:
* **Client**: `http://localhost:5173` (Nginx reverse proxy to API)
* **API Server**: `http://localhost:5000/api/v1`
* **PostgreSQL**: `localhost:5432`
* **Redis**: `localhost:6379`

---

## 🗺️ Roadmap & Phase Rollout

- [x] **Phase 1: Foundation (Current Deliverable)**
  - WhatsApp Baileys Ingestion Engine
  - Yarn Production PostgreSQL Repository
  - React Executive Dashboard & Charts
  - ExcelJS Streaming Exporter
  - Role-Based Access Control (RBAC) & Centralized Audit Trail
- [ ] **Phase 2: Supply Chain & CRM** (Inventory lot tracking, Yarn Spinners, Textile Clients)
- [ ] **Phase 3: Mill Operations** (Sales Orders, Loom Scheduling, Machine Maintenance)
- [ ] **Phase 4: Quality & Business Intelligence** (Fabric Inspection, Waste Ratio, Loom OEE)
- [ ] **Phase 5: AI Automation** (WhatsApp Natural Language Assistant, Yarn Demand Forecasting)

---

## 📄 License

Proprietary — Textile Enterprise Systems © 2026.
