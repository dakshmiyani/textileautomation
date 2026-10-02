/**
 * Migration: 006_create_audit_logs.js
 * Tracks critical business and user actions for ERP compliance
 */
exports.up = async function(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable(); // CREATE, UPDATE, DELETE, EXPORT, CONNECT, DISCONNECT
    table.string('module', 50).notNullable(); // PRODUCTION, WHATSAPP, AUTH, INVENTORY, USERS
    table.string('entity', 50); // production_records, whatsapp_connections, etc.
    table.string('entity_id', 100);
    table.text('old_value'); // JSON string
    table.text('new_value'); // JSON string
    table.string('ip_address', 50);
    table.string('user_agent', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['module']);
    table.index(['action']);
    table.index(['created_at']);
    table.index(['user_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};
