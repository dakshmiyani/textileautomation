/**
 * Migration: 008_create_orders_table.js
 * Creates the orders table for Textile ERP (sales orders, yarn job work, sizing & weaving orders)
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('orders');
  if (!exists) {
    await knex.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('order_no', 100).notNullable();
      table.string('order_date', 30).notNullable();
      table.string('mill_name', 150).nullable();
      table.string('party_name', 150).notNullable();
      table.text('billing_address').nullable();
      table.string('gst_no', 50).nullable();
      table.string('item_name', 150).notNullable();
      table.integer('ends').unsigned().notNullable();
      table.decimal('panna', 8, 2).defaultTo(0);
      table.decimal('denier', 8, 2).defaultTo(21);
      table.integer('beam_count').unsigned().defaultTo(1);
      table.decimal('meter_per_beam', 12, 2).defaultTo(0);
      table.decimal('total_meters', 12, 2).notNullable();
      
      // Technical Metrics
      table.decimal('weight_per_beam_kg', 10, 2).defaultTo(0);
      table.decimal('total_weight_kg', 10, 2).defaultTo(0);

      // Financials
      table.decimal('rate', 10, 2).defaultTo(0);
      table.string('rate_type', 20).defaultTo('PER_KG'); // PER_KG, PER_METER
      table.string('rate_note', 50).defaultTo('++');
      table.decimal('basic_amount', 14, 2).defaultTo(0);
      table.decimal('cartage_rate', 10, 2).defaultTo(0);
      table.decimal('cartage_total', 10, 2).defaultTo(0);
      table.decimal('out_beam_rate', 10, 2).defaultTo(0);
      table.decimal('out_beam_total', 10, 2).defaultTo(0);
      table.decimal('subtotal', 14, 2).defaultTo(0);
      table.decimal('gst_percent', 5, 2).defaultTo(0);
      table.decimal('gst_amount', 14, 2).defaultTo(0);
      table.decimal('grand_total', 14, 2).defaultTo(0);

      // Logistics & Terms
      table.text('terms').nullable();
      table.text('delivery').nullable();
      table.text('notes').nullable();
      table.string('status', 30).defaultTo('CONFIRMED'); // CONFIRMED, IN_PROGRESS, DELIVERED, CANCELLED
      table.string('source', 30).defaultTo('WHATSAPP'); // WHATSAPP, MANUAL
      table.string('whatsapp_number', 50).nullable();
      table.string('whatsapp_message_id', 150).nullable();
      table.text('raw_message').nullable();
      table.text('reply_message').nullable();

      table.timestamps(true, true);

      // Indexes
      table.index(['order_no']);
      table.index(['party_name']);
      table.index(['status']);
      table.index(['order_date']);
      table.index(['created_at']);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('orders');
};
