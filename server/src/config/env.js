require('dotenv').config();
const { z } = require('zod');
const path = require('path');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  HOST: z.string().default('0.0.0.0'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Database
  DB_CLIENT: z.enum(['pg']).default('pg'),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('textile_erp'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SSL: z.string().transform(v => v === 'true').default('false'),

  // JWT
  JWT_SECRET: z.string().default('textile_erp_super_secret_jwt_key_2026_change_in_production'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_SECRET: z.string().default('textile_erp_refresh_secret_key_2026'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Storage
  STORAGE_DIR: z.string().default(path.join(__dirname, '..', '..', 'storage')),
  WHATSAPP_AUTH_DIR: z.string().default(path.join(__dirname, '..', '..', 'storage', 'whatsapp-auth')),

  // WhatsApp
  DUPLICATE_WINDOW_SECONDS: z.string().transform(Number).default('180'),
  WHATSAPP_RECONNECT_INTERVAL_MS: z.string().transform(Number).default('3000'),

  // Logging
  LOG_LEVEL: z.string().default('info')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
