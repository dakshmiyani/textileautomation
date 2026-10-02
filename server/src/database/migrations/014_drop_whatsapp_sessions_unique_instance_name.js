/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Drop unique constraint on instance_name to support multi-tenancy correctly
  await knex.schema.alterTable('whatsapp_sessions', (table) => {
    table.dropUnique(['instance_name'], 'whatsapp_connections_instance_name_unique');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('whatsapp_sessions', (table) => {
    table.unique(['instance_name'], 'whatsapp_connections_instance_name_unique');
  });
};
