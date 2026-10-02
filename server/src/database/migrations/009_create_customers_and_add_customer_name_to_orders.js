/**
 * Migration: 009_create_customers_and_add_customer_name_to_orders.js
 * Creates customers directory table and adds customer_name to orders table
 */
exports.up = async function(knex) {
  // 1. Add customer_name column to orders if not exists
  const hasOrdersTable = await knex.schema.hasTable('orders');
  if (hasOrdersTable) {
    const hasCustomerName = await knex.schema.hasColumn('orders', 'customer_name');
    if (!hasCustomerName) {
      await knex.schema.alterTable('orders', (table) => {
        table.string('customer_name', 150).nullable().after('mill_name');
        table.index(['customer_name']);
      });
    }
  }

  // 2. Create customers table
  const hasCustomersTable = await knex.schema.hasTable('customers');
  if (!hasCustomersTable) {
    await knex.schema.createTable('customers', (table) => {
      table.increments('id').primary();
      table.string('customer_name', 150).nullable();
      table.string('party_name', 150).notNullable();
      table.text('billing_address').nullable();
      table.string('gst_no', 50).nullable();
      table.string('phone_number', 50).nullable();
      table.timestamps(true, true);

      table.index(['phone_number']);
      table.index(['party_name']);
      table.index(['customer_name']);
    });
  }
};

exports.down = async function(knex) {
  const hasCustomersTable = await knex.schema.hasTable('customers');
  if (hasCustomersTable) {
    await knex.schema.dropTable('customers');
  }

  const hasOrdersTable = await knex.schema.hasTable('orders');
  if (hasOrdersTable) {
    const hasCustomerName = await knex.schema.hasColumn('orders', 'customer_name');
    if (hasCustomerName) {
      await knex.schema.alterTable('orders', (table) => {
        table.dropColumn('customer_name');
      });
    }
  }
};
