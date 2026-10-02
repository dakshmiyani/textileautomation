/**
 * Migration: 001_create_roles_and_permissions.js
 * Creates roles, permissions, and role_permissions join table
 */
exports.up = async function(knex) {
  // Roles table
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name', 50).unique().notNullable(); // SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR, VIEWER
    table.string('description', 255);
    table.timestamps(true, true);
  });

  // Permissions table
  await knex.schema.createTable('permissions', (table) => {
    table.increments('id').primary();
    table.string('name', 100).unique().notNullable(); // production.read, production.create, whatsapp.manage, etc.
    table.string('module', 50).notNullable(); // production, whatsapp, inventory, reports, users
    table.string('description', 255);
    table.timestamps(true, true);
  });

  // Role permissions table
  await knex.schema.createTable('role_permissions', (table) => {
    table.increments('id').primary();
    table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.unique(['role_id', 'permission_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
};
