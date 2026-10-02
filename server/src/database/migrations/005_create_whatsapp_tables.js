/**
 * Migration: 005_create_whatsapp_tables.js
 * Tracks WhatsApp connection states and comprehensive incoming message logs
 */
exports.up = async function(knex) {
  // Connection states
  await knex.schema.createTable('whatsapp_connections', (table) => {
    table.increments('id').primary();
    table.string('instance_name', 50).defaultTo('default').unique();
    table.string('phone_number', 50);
    table.string('status', 30).defaultTo('DISCONNECTED'); // CONNECTED, DISCONNECTED, CONNECTING, QR_READY
    table.text('qr_code'); // Terminal QR or Base64 string for dashboard display
    table.timestamp('last_connected_at');
    table.timestamps(true, true);
  });

  // Message Logs
  await knex.schema.createTable('whatsapp_messages', (table) => {
    table.increments('id').primary();
    table.string('message_id', 150).index();
    table.string('sender_jid', 150);
    table.string('phone_number', 50).index();
    table.string('sender_name', 150);
    table.text('raw_text');
    table.string('status', 30).defaultTo('PROCESSED'); // PROCESSED, INVALID_FORMAT, DUPLICATE, IGNORED
    table.integer('production_record_id').unsigned().references('id').inTable('production_records').onDelete('SET NULL');
    table.text('error_message');
    table.timestamps(true, true);

    table.index(['created_at']);
    table.index(['status']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('whatsapp_messages');
  await knex.schema.dropTableIfExists('whatsapp_connections');
};
