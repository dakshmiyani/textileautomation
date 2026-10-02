# Textile ERP — API Documentation (`/api/v1`)

All endpoints are versioned and mounted at `/api/v1`.

---

## 1. Response Contracts

### Success Response
```json
{
  "success": true,
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "meter",
      "message": "Meter must be a positive number"
    }
  ]
}
```

---

## 2. Authentication Headers

Include the JWT bearer token in the `Authorization` header for protected endpoints:

```text
Authorization: Bearer <accessToken>
```

---

## 3. Endpoints Reference

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Permission | Description |
| ------ | -------- | ---------- | ----------- |
| `POST` | `/auth/login` | Public | Authenticate with email & password, returns JWT tokens |
| `POST` | `/auth/refresh-token` | Public | Exchange refresh token for new access token |
| `POST` | `/auth/logout` | Authenticated | Revoke session and log audit event |
| `GET`  | `/auth/me` | Authenticated | Retrieve active user profile, role, and permissions |
| `PUT`  | `/auth/me` | Authenticated | Update user profile or change password |

---

### 🏭 Production (`/api/v1/production`)

| Method | Endpoint | Permission | Description |
| ------ | -------- | ---------- | ----------- |
| `GET`  | `/production` | `production.read` | Paginated list with search, date ranges, and sorting |
| `GET`  | `/production/:id` | `production.read` | Retrieve single production record details |
| `POST` | `/production` | `production.create` | Create a manual production entry |
| `PUT`  | `/production/:id` | `production.update` | Update a production entry |
| `DELETE` | `/production/:id` | `production.delete` | Delete a production entry (audited) |
| `GET`  | `/production/kpis` | `production.read` | Get real-time dashboard KPIs |
| `GET`  | `/production/analytics` | `production.read` | Get daily production and yarn breakdown metrics |
| `GET`  | `/production/export` | `reports.export` | Stream styled Excel (.xlsx) file download |

#### Query Parameters for `GET /production`:
- `page`: Page number (default: `1`)
- `limit`: Records per page (default: `20`)
- `search`: Search query matching yarn, worker, or phone number
- `from`: Start date filter (YYYY-MM-DD)
- `to`: End date filter (YYYY-MM-DD)
- `source`: Source filter (`ALL`, `WHATSAPP`, `MANUAL`)
- `sortBy`: Column to sort (`date`, `meter`, `total_beam`, `yarn`)
- `sortOrder`: Sort direction (`asc`, `desc`)

---

### 📱 WhatsApp Gateway (`/api/v1/whatsapp`)

| Method | Endpoint | Permission | Description |
| ------ | -------- | ---------- | ----------- |
| `GET`  | `/whatsapp/status` | `whatsapp.read` | Gateway status, session name, phone, QR code Data URL |
| `POST` | `/whatsapp/connect` | `whatsapp.manage` | Initialize Baileys socket connection |
| `POST` | `/whatsapp/disconnect` | `whatsapp.manage` | Cleanly disconnect WhatsApp socket |
| `POST` | `/whatsapp/reconnect` | `whatsapp.manage` | Force restart socket connection |
| `GET`  | `/whatsapp/logs` | `whatsapp.read` | Paginated incoming message audit logs |

---

### 🛡️ Audit Trail (`/api/v1/audit`)

| Method | Endpoint | Permission | Description |
| ------ | -------- | ---------- | ----------- |
| `GET`  | `/audit` | `audit.read` | Paginated immutable system activity audit trail |

---

### ⚙️ Factory Equipment & Users

| Method | Endpoint | Permission | Description |
| ------ | -------- | ---------- | ----------- |
| `GET`  | `/machines` | Authenticated | List all loom machines and operational states |
| `GET`  | `/users` | `users.manage` | List all users and assigned roles |
