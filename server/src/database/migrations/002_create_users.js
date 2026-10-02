/**
 * Migration: 002_create_users.js
 * Creates users table with role relationship
 */
exports.up = async function(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('email', 150).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('phone', 30);
    table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('RESTRICT');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at');
    table.timestamps(true, true);

    table.index(['email']);
    table.index(['role_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('users');
};
