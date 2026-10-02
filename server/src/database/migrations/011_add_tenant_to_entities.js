/**
 * Migration: 011_add_tenant_to_entities.js
 * Adds tenant_id to all tenant-scoped tables and backfills data
 */
exports.up = async function(knex) {
  // Get default tenant
  const defaultTenantObj = await knex('tenants').where({ slug: 'default' }).first();
  if (!defaultTenantObj) {
    throw new Error('Default tenant not found. Cannot safely apply tenant_id to entities.');
  }
  const defaultTenantId = defaultTenantObj.id;

  const tablesToUpdate = [
    'factories',
    'machines',
    'production_records',
    'whatsapp_messages',
    'audit_logs',
    'orders',
    'customers'
  ];

  // 1. Rename whatsapp_connections to whatsapp_sessions
  const hasWhatsappConnections = await knex.schema.hasTable('whatsapp_connections');
  if (hasWhatsappConnections) {
    await knex.schema.renameTable('whatsapp_connections', 'whatsapp_sessions');
    
    // Add session_key column
    await knex.schema.alterTable('whatsapp_sessions', (table) => {
      table.string('session_key', 150).nullable();
    });

    // Backfill session_key
    await knex('whatsapp_sessions').update({ session_key: knex.raw('instance_name') });
  }

  // Include whatsapp_sessions in updates
  tablesToUpdate.push('whatsapp_sessions');

  // 2. Add nullable tenant_id to all tables
  for (const tableName of tablesToUpdate) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      await knex.schema.alterTable(tableName, (table) => {
        table.integer('tenant_id').unsigned().nullable().references('id').inTable('tenants').onDelete('CASCADE');
      });
    }
  }

  // 3. Backfill tenant_id with default tenant
  for (const tableName of tablesToUpdate) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      await knex(tableName).update({ tenant_id: defaultTenantId });
    }
  }

  // 4. Alter columns to NOT NULL and add indexes
  for (const tableName of tablesToUpdate) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      await knex.schema.alterTable(tableName, (table) => {
        table.integer('tenant_id').notNullable().alter();
        table.index(['tenant_id']);
      });
    }
  }
};

exports.down = async function(knex) {
  const tablesToUpdate = [
    'factories',
    'machines',
    'production_records',
    'whatsapp_messages',
    'audit_logs',
    'orders',
    'customers'
  ];

  const hasWhatsappSessions = await knex.schema.hasTable('whatsapp_sessions');
  if (hasWhatsappSessions) {
    await knex.schema.alterTable('whatsapp_sessions', (table) => {
      table.dropColumn('tenant_id');
      table.dropColumn('session_key');
    });
    await knex.schema.renameTable('whatsapp_sessions', 'whatsapp_connections');
  }

  for (const tableName of tablesToUpdate) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropColumn('tenant_id');
      });
    }
  }
};
