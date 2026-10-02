# Textile ERP — Authentication & RBAC

## 1. Role-Based Access Control (RBAC)

The system does not hardcode permissions to roles. Instead, it decouples them using a relational **Role-Permission Matrix** in PostgreSQL (`roles`, `permissions`, `role_permissions`).

### Available Roles
1. **`SUPER_ADMIN`**: Full enterprise access across all factories, configurations, users, and audit logs.
2. **`ADMIN`**: Factory administrator managing production, inventory, WhatsApp connections, and reports.
3. **`MANAGER`**: Operations manager supervising schedules, approving batches, and generating exports.
4. **`SUPERVISOR`**: Loom shed supervisor logging manual production, inspecting records, and reviewing messages.
5. **`OPERATOR`**: Factory worker entering machine batch outputs and viewing active machine status.
6. **`VIEWER`**: Read-only auditor or executive checking high-level KPI dashboards.

---

## 2. Granular Permissions Matrix

| Permission Name | Category | Roles Granted by Default Seed |
| --------------- | -------- | ----------------------------- |
| `production.read` | Production | All Roles |
| `production.create`| Production | `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SUPERVISOR`, `OPERATOR` |
| `production.update`| Production | `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SUPERVISOR` |
| `production.delete`| Production | `SUPER_ADMIN`, `ADMIN` |
| `whatsapp.read` | WhatsApp | `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SUPERVISOR` |
| `whatsapp.manage` | WhatsApp | `SUPER_ADMIN`, `ADMIN` |
| `reports.read` | Reports | `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SUPERVISOR`, `VIEWER` |
| `reports.export` | Reports | `SUPER_ADMIN`, `ADMIN`, `MANAGER` |
| `inventory.read` | Inventory | All Roles |
| `inventory.create`| Inventory | `SUPER_ADMIN`, `ADMIN`, `MANAGER` |
| `inventory.update`| Inventory | `SUPER_ADMIN`, `ADMIN`, `MANAGER` |
| `inventory.delete`| Inventory | `SUPER_ADMIN`, `ADMIN` |
| `users.manage` | Administration | `SUPER_ADMIN`, `ADMIN` |
| `audit.read` | Audit Trail | `SUPER_ADMIN`, `ADMIN` |

---

## 3. JWT Token Flow

```text
Client ──► POST /api/v1/auth/login { email, password }
           ↓
Server verifies bcrypt hash (10 salt rounds)
           ↓
Issues:
  - Access Token (short-lived, 1 day, contains permissions & factory ID)
  - Refresh Token (7 days, stored securely in HTTP-only or secure storage)
           ↓
On 401 Unauthorized:
Client automatically queues requests and calls /api/v1/auth/refresh-token
```

---

## 4. Frontend Navigation Guard

The sidebar does not manually check roles. It checks permissions dynamically:

```javascript
const NAV_ITEMS = [
  { label: 'Yarn Production', path: '/production', permission: 'production.read' },
  { label: 'WhatsApp Gateway', path: '/whatsapp', permission: 'whatsapp.read' },
  { label: 'System Settings', path: '/settings', permission: 'users.manage' }
];

const visibleItems = NAV_ITEMS.filter(item => hasPermission(item.permission));
```
