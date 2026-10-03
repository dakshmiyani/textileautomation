# Antigravity Rules & Project Constraints

**CRITICAL INSTRUCTION FOR ALL AGENTS**: What has been finalized in this project MUST NOT be rewritten, restructured, or fundamentally changed unless explicitly requested by the user. Only perform additive changes, targeted bug fixes, and requested feature development.

## 1. Multi-Tenant Architecture (Finalized)
- The platform is a Multi-Tenant SaaS.
- **SaaS Owner**: The developer/super-admin managing the SaaS instance.
- **Clients/Admins**: Each client operates under their own isolated `tenant_id`.
- **Database Isolation**: All core tables (`production_records`, `orders`, `customers`, `whatsapp_sessions`) are strictly isolated by `tenant_id`. NEVER remove or bypass `tenant_id` scopes in queries.
- **WhatsApp Isolation**: Each tenant has their own isolated Baileys WhatsApp connection. Auth states are stored in `/server/storage/whatsapp-auth/tenant_<ID>`. This folder structure must be preserved.

## 2. WhatsApp Bot & Event Flows (Finalized)
- **Order Generation**: The `production.service.js` automatically creates orders when valid production records are submitted.
- **Message Loop Prevention**: The `whatsapp.messageHandler.js` is specifically configured NOT to reply with full Order Confirmation formats to incoming Order Confirmations, preventing infinite bot-to-bot ping-pong loops. Do not revert this behavior.

## 3. Tech Stack (Finalized)
- **Backend**: Node.js, Express, Knex.js, PostgreSQL, Baileys (WhatsApp Web API).
- **Frontend**: React, Vite, TailwindCSS.
- **Do not** introduce new major frameworks, ORMs, or rewrite the API layer.

## 4. Operational Rules
- **Do NOT** rebuild the app or suggest major rewrites.
- **Update this file** whenever a major new architectural rule or constraint is finalized by the user.
