/**
 * Migration: 012_make_audit_tenant_nullable.js
 * Make tenant_id on audit_logs nullable to allow system-level logging (auth).
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('audit_logs', (table) => {
    table.integer('tenant_id').nullable().alter();
  });
};

exports.down = async function(knex) {
  // It's dangerous to set it back to NOT NULL if we have nulls, but for rollback semantics:
  await knex('audit_logs').whereNull('tenant_id').del();
  await knex.schema.alterTable('audit_logs', (table) => {
    table.integer('tenant_id').notNullable().alter();
  });
};
