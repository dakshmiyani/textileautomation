/**
 * Migration: 007_add_notes_to_whatsapp_connections.js
 * Adds the notes column to track detailed connection status/errors
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('whatsapp_connections', (table) => {
    table.text('notes');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('whatsapp_connections', (table) => {
    table.dropColumn('notes');
  });
};
