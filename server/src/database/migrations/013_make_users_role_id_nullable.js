/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Make users.role_id nullable since roles are now managed via tenant_users
  await knex.schema.alterTable('users', (table) => {
    table.integer('role_id').nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Try to restore NOT NULL constraint
  await knex.schema.alterTable('users', (table) => {
    table.integer('role_id').notNullable().alter();
  });
};
