/**
 * Migration: 003_create_factories_and_machines.js
 * Multi-factory, company, and machine support
 */
exports.up = async function(knex) {
  // Companies
  await knex.schema.createTable('companies', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable();
    table.string('code', 50).unique();
    table.timestamps(true, true);
  });

  // Factories
  await knex.schema.createTable('factories', (table) => {
    table.increments('id').primary();
    table.integer('company_id').unsigned().references('id').inTable('companies').onDelete('CASCADE');
    table.string('name', 150).notNullable();
    table.string('location', 255);
    table.timestamps(true, true);
  });

  // Machines (looms, warping machines, etc.)
  await knex.schema.createTable('machines', (table) => {
    table.increments('id').primary();
    table.integer('factory_id').unsigned().references('id').inTable('factories').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('code', 50).unique();
    table.string('type', 50).defaultTo('WEAVING_LOOM'); // WEAVING_LOOM, WARPING, SIZING
    table.string('status', 30).defaultTo('ACTIVE'); // ACTIVE, MAINTENANCE, OFFLINE
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('machines');
  await knex.schema.dropTableIfExists('factories');
  await knex.schema.dropTableIfExists('companies');
};
