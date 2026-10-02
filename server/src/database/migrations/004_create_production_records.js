/**
 * Migration: 004_create_production_records.js
 * Stores Yarn Production entries with metrics, source tracking, and multi-factory keys
 */
exports.up = async function(knex) {
  await knex.schema.createTable('production_records', (table) => {
    table.increments('id').primary();
    table.string('date', 20).notNullable(); // YYYY-MM-DD or DD-MM-YYYY
    table.string('time', 20).notNullable(); // HH:mm
    table.string('contact_name', 150).defaultTo('Unknown');
    table.string('whatsapp_number', 50).nullable();
    table.string('yarn', 100).notNullable();
    table.integer('ends').unsigned().notNullable();
    table.decimal('meter', 12, 2).notNullable();
    table.decimal('panna', 8, 2).notNullable();
    table.integer('total_beam').unsigned().notNullable();

    // Source tracking and multi-tier multi-factory hierarchy
    table.string('source', 30).defaultTo('WHATSAPP'); // WHATSAPP, MANUAL, API
    table.string('whatsapp_message_id', 150);
    table.text('raw_message');
    table.integer('company_id').unsigned().references('id').inTable('companies').onDelete('SET NULL');
    table.integer('factory_id').unsigned().references('id').inTable('factories').onDelete('SET NULL');
    table.integer('machine_id').unsigned().references('id').inTable('machines').onDelete('SET NULL');
    table.string('status', 30).defaultTo('COMPLETED'); // COMPLETED, PENDING, IN_PROGRESS, REJECTED
    table.text('notes');

    table.timestamps(true, true);

    // Indexes for fast queries, filtering, and reporting
    table.index(['date']);
    table.index(['whatsapp_number']);
    table.index(['yarn']);
    table.index(['source']);
    table.index(['status']);
    table.index(['created_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('production_records');
};
