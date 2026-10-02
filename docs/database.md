# Textile ERP — Database Documentation

The database layer utilizes **PostgreSQL** managed strictly via **Knex.js** programmatic migrations and seeds. A development SQLite fallback mode is included for zero-dependency local runs.

---

## 1. Migration Hierarchy

All database tables are created incrementally using sequential migrations in `server/src/database/migrations/`:

| Migration File | Primary Tables Created | Purpose |
| -------------- | ---------------------- | ------- |
| `001_create_roles_and_permissions.js` | `roles`, `permissions`, `role_permissions` | RBAC roles and granular system privileges |
| `002_create_users.js` | `users` | User credentials, password hash, role linkage, factory assignment |
| `003_create_factories_and_machines.js` | `companies`, `factories`, `machines` | Multi-factory and loom equipment hierarchy |
| `004_create_production_records.js` | `production_records` | Core yarn production telemetry, meters, beams, WhatsApp message ID |
| `005_create_whatsapp_tables.js` | `whatsapp_connections`, `whatsapp_messages` | Baileys connection status, QR states, inbound message logs |
| `006_create_audit_logs.js` | `audit_logs` | Immutable audit trail for all business actions |

---

## 2. Table Specifications

### `production_records`
Stores individual production runs reported through WhatsApp or the ERP manual interface.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Record ID |
| `date` | `VARCHAR(20)` | Not Null, Indexed | Date of production (YYYY-MM-DD) |
| `time` | `VARCHAR(20)` | Not Null | Time of production (HH:mm) |
| `contact_name` | `VARCHAR(150)` | Nullable | Worker name or phone-saved contact |
| `whatsapp_number` | `VARCHAR(50)` | Nullable, Indexed | Sender phone (+91...) |
| `yarn` | `VARCHAR(100)` | Not Null, Indexed | Yarn specification (e.g., 40s Combed Hosiery) |
| `ends` | `INTEGER` | Not Null | Number of ends in beam |
| `meter` | `DECIMAL(12,2)`| Not Null | Manufactured meters |
| `panna` | `DECIMAL(8,2)` | Not Null | Beam width (Panna) |
| `total_beam` | `INTEGER` | Not Null | Number of beams produced |
| `source` | `VARCHAR(30)` | Default 'MANUAL', Indexed | `WHATSAPP`, `MANUAL`, `API` |
| `whatsapp_message_id` | `VARCHAR(150)` | Nullable | Baileys message ID for duplicate tracking |
| `raw_message` | `TEXT` | Nullable | Original incoming message text |
| `company_id` | `INTEGER` | Nullable, FK `companies` | Multi-factory company tenant |
| `factory_id` | `INTEGER` | Nullable, FK `factories` | Factory unit location |
| `machine_id` | `INTEGER` | Nullable, FK `machines` | Loom machine reference |
| `status` | `VARCHAR(30)` | Default 'COMPLETED', Indexed | `COMPLETED`, `PENDING`, `REJECTED` |
| `notes` | `TEXT` | Nullable | Remarks |
| `created_at` | `TIMESTAMP` | Default Now, Indexed | Creation timestamp |
| `updated_at` | `TIMESTAMP` | Default Now | Modification timestamp |

---

### `whatsapp_messages`
Stores an audit trail of all messages intercepted by the Baileys socket.

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | `INTEGER` | Primary Key |
| `message_id` | `VARCHAR(150)` | Unique WhatsApp message ID |
| `sender_number` | `VARCHAR(50)` | E.164 phone number |
| `sender_name` | `VARCHAR(150)` | PushName or phone address book name |
| `raw_content` | `TEXT` | Raw payload string |
| `status` | `VARCHAR(30)` | `PROCESSED`, `DUPLICATE`, `IGNORED`, `INVALID`, `FAILED` |
| `error_message` | `TEXT` | Validation or system error message |
| `production_record_id` | `INTEGER` | Foreign key to `production_records` (if valid) |
| `created_at` | `TIMESTAMP` | Time message was received |

---

### `audit_logs`
Records every critical user action and integration event.

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | `INTEGER` | Primary Key |
| `user_id` | `INTEGER` | Foreign key to `users` |
| `action` | `VARCHAR(100)` | Action verb (`CREATE_PRODUCTION_RECORD`, `LOGIN`, `EXPORT_EXCEL`) |
| `module` | `VARCHAR(50)` | Domain module (`PRODUCTION`, `AUTH`, `WHATSAPP`) |
| `entity` | `VARCHAR(50)` | Target entity (`PRODUCTION_RECORD`, `USER`, `WHATSAPP_GATEWAY`) |
| `entity_id` | `VARCHAR(50)` | Primary key of affected entity |
| `old_value` | `JSON` | Snapshot before edit/delete |
| `new_value` | `JSON` | Snapshot after creation/update |
| `ip_address` | `VARCHAR(45)` | Client IP address |
| `user_agent` | `TEXT` | Client user agent |
| `created_at` | `TIMESTAMP` | Event timestamp |

---

## 3. Query Performance & Indexing

All high-traffic search vectors include B-tree indexes:
- `production_records`: `date`, `whatsapp_number`, `yarn`, `source`, `status`, `created_at`
- `whatsapp_messages`: `message_id`, `sender_number`, `status`, `created_at`
- `audit_logs`: `user_id`, `module`, `action`, `created_at`
