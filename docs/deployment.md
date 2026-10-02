# Textile ERP — Production Deployment Guide

## 1. Quick Start with Docker Compose

The easiest way to run the full stack (PostgreSQL, Redis, Express API, and Nginx React frontend) is with Docker Compose:

```bash
# 1. Clone or navigate to the project directory
cd textile-erp

# 2. Build and start containers in the background
docker-compose up -d --build

# 3. View live server logs
docker-compose logs -f server
```

The application will be accessible at:
- **ERP Web Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/v1`
- **PostgreSQL**: `localhost:5432`

---

## 2. Bare-Metal / VPS Deployment (PM2 + Nginx)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env` in `server/` and update production secrets:
```bash
cd server
cp .env.example .env
nano .env
```

Ensure:
- `NODE_ENV=production`
- Strong random strings for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Correct PostgreSQL credentials in `DATABASE_URL`

### Step 3: Run Database Migrations & Seeds
```bash
npm run migrate --workspace=server
npm run seed --workspace=server
```

### Step 4: Build Client
```bash
npm run build --workspace=client
```

### Step 5: Start with PM2
```bash
# Start backend server
pm2 start server/src/server.js --name "textile-erp-server"

# Save PM2 process list to start automatically on reboot
pm2 save
pm2 startup
```

---

## 3. Database Backups

Schedule automated daily PostgreSQL dumps:
```bash
pg_dump -U postgres -d textile_erp | gzip > /backups/textile_erp_$(date +%Y%m%d).sql.gz
```
