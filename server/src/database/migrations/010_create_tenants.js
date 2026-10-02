/**
 * Migration: 010_create_tenants.js
 * Creates multi-tenancy foundation (tenants and tenant_users)
 */
exports.up = async function(knex) {
  // 1. Create tenants table
  await knex.schema.createTable('tenants', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable();
    table.string('slug', 150).unique().notNullable();
    table.string('status', 30).defaultTo('ACTIVE'); // ACTIVE, SUSPENDED, CANCELLED
    table.string('email', 150).nullable();
    table.string('phone', 50).nullable();
    table.text('address').nullable();
    table.jsonb('settings').defaultTo('{}');
    table.timestamps(true, true);
  });

  // 2. Create tenant_users (Membership table)
  await knex.schema.createTable('tenant_users', (table) => {
    table.increments('id').primary();
    table.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('RESTRICT');
    table.string('status', 30).defaultTo('ACTIVE');
    table.timestamps(true, true);

    table.unique(['tenant_id', 'user_id']);
  });

  // 3. Create initial Default Tenant (Tenant #1)
  const [defaultTenant] = await knex('tenants')
    .insert({
      name: 'Default Textile Company',
      slug: 'default',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning('id');

  const tenantId = defaultTenant.id ? defaultTenant.id : defaultTenant;

  // 4. Migrate existing users into tenant_users
  const existingUsers = await knex('users').select('id', 'role_id');
  if (existingUsers.length > 0) {
    const memberships = existingUsers.map(user => ({
      tenant_id: tenantId,
      user_id: user.id,
      role_id: user.role_id,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date()
    }));
    await knex('tenant_users').insert(memberships);
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('tenant_users');
  await knex.schema.dropTableIfExists('tenants');
};
