const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Clear existing data in reverse dependency order
  await knex('audit_logs').del();
  await knex('whatsapp_messages').del();
  await knex('whatsapp_connections').del();
  await knex('production_records').del();
  await knex('machines').del();
  await knex('factories').del();
  await knex('companies').del();
  await knex('users').del();
  await knex('role_permissions').del();
  await knex('permissions').del();
  await knex('roles').del();

  // 1. Roles
  const roles = [
    { id: 1, name: 'SUPER_ADMIN', description: 'Full access to all ERP modules and settings' },
    { id: 2, name: 'ADMIN', description: 'Administrative access to all operations' },
    { id: 3, name: 'MANAGER', description: 'Production & inventory management with reports export' },
    { id: 4, name: 'SUPERVISOR', description: 'Floor supervisor capable of editing production' },
    { id: 5, name: 'OPERATOR', description: 'Machine operator entering production data' },
    { id: 6, name: 'VIEWER', description: 'Read-only access to dashboards and reports' }
  ];
  await knex('roles').insert(roles);

  // 2. Permissions
  const permissions = [
    // Production
    { id: 1, name: 'production.read', module: 'production', description: 'View production records and KPIs' },
    { id: 2, name: 'production.create', module: 'production', description: 'Create production entries' },
    { id: 3, name: 'production.update', module: 'production', description: 'Update existing production entries' },
    { id: 4, name: 'production.delete', module: 'production', description: 'Delete production entries' },
    { id: 5, name: 'production.export', module: 'production', description: 'Export production data to Excel/CSV' },

    // WhatsApp
    { id: 6, name: 'whatsapp.read', module: 'whatsapp', description: 'View WhatsApp connection and message logs' },
    { id: 7, name: 'whatsapp.manage', module: 'whatsapp', description: 'Connect, disconnect, and control WhatsApp' },

    // Inventory
    { id: 8, name: 'inventory.read', module: 'inventory', description: 'View yarn and material inventory' },
    { id: 9, name: 'inventory.create', module: 'inventory', description: 'Add inventory items and stock' },
    { id: 10, name: 'inventory.update', module: 'inventory', description: 'Update inventory transactions' },

    // Reports
    { id: 11, name: 'reports.read', module: 'reports', description: 'View analytics and business reports' },
    { id: 12, name: 'reports.export', module: 'reports', description: 'Export advanced management reports' },

    // Users & Audit
    { id: 13, name: 'users.manage', module: 'users', description: 'Manage ERP users and assign roles' },
    { id: 14, name: 'audit.read', module: 'audit', description: 'View ERP audit trail and logs' }
  ];
  await knex('permissions').insert(permissions);

  // 3. Role-Permissions
  // Admin gets all permissions
  const adminPermissions = permissions.map(p => ({ role_id: 1, permission_id: p.id }));
  const regularAdminPermissions = permissions.map(p => ({ role_id: 2, permission_id: p.id }));

  // Manager gets production, whatsapp, inventory, reports
  const managerPermIds = [1, 2, 3, 5, 6, 8, 9, 10, 11, 12];
  const managerPermissions = managerPermIds.map(id => ({ role_id: 3, permission_id: id }));

  // Supervisor
  const supervisorPermIds = [1, 2, 3, 5, 6, 8, 11];
  const supervisorPermissions = supervisorPermIds.map(id => ({ role_id: 4, permission_id: id }));

  // Operator
  const operatorPermIds = [1, 2];
  const operatorPermissions = operatorPermIds.map(id => ({ role_id: 5, permission_id: id }));

  // Viewer
  const viewerPermIds = [1, 6, 8, 11];
  const viewerPermissions = viewerPermIds.map(id => ({ role_id: 6, permission_id: id }));

  await knex('role_permissions').insert([
    ...adminPermissions,
    ...regularAdminPermissions,
    ...managerPermissions,
    ...supervisorPermissions,
    ...operatorPermissions,
    ...viewerPermissions
  ]);

  // 4. Default Admin User
  const passwordHash = bcrypt.hashSync('Admin@123', 10);
  await knex('users').insert({
    id: 1,
    name: 'System Administrator',
    email: 'admin@textileerp.com',
    password_hash: passwordHash,
    phone: '+919876543210',
    role_id: 1,
    is_active: true
  });

  // 5. Default Company, Factory, and Machines
  await knex('companies').insert({
    id: 1,
    name: 'Apex Textile Mills Ltd',
    code: 'APEX-01'
  });

  await knex('factories').insert({
    id: 1,
    company_id: 1,
    name: 'Unit 1 - Weaving & Sizing Plant',
    location: 'Surat Textile Zone, Gujarat'
  });

  await knex('machines').insert([
    { id: 1, factory_id: 1, name: 'Loom #1 (Tsudakoma ZAX)', code: 'LOOM-01', type: 'WEAVING_LOOM', status: 'ACTIVE' },
    { id: 2, factory_id: 1, name: 'Loom #2 (Toyota JAT810)', code: 'LOOM-02', type: 'WEAVING_LOOM', status: 'ACTIVE' },
    { id: 3, factory_id: 1, name: 'Loom #3 (Picanol OmniPlus)', code: 'LOOM-03', type: 'WEAVING_LOOM', status: 'ACTIVE' },
    { id: 4, factory_id: 1, name: 'Warping Machine #1 (Karl Mayer)', code: 'WARP-01', type: 'WARPING', status: 'ACTIVE' }
  ]);

  // 6. Initial Sample Production Records
  await knex('production_records').insert([
    {
      date: '30-09-2026',
      time: '20:45',
      contact_name: 'Ramesh Patel',
      whatsapp_number: '+917021483568',
      yarn: '40s Combed',
      ends: 1200,
      meter: 5000,
      panna: 63,
      total_beam: 10,
      source: 'WHATSAPP',
      machine_id: 1,
      factory_id: 1,
      status: 'VERIFIED'
    },
    {
      date: '30-09-2026',
      time: '21:11',
      contact_name: 'Daksha Weavers',
      whatsapp_number: '+917990106803',
      yarn: '30s Cotton',
      ends: 1200,
      meter: 5000,
      panna: 63,
      total_beam: 10,
      source: 'WHATSAPP',
      machine_id: 2,
      factory_id: 1,
      status: 'VERIFIED'
    },
    {
      date: '30-09-2026',
      time: '21:13',
      contact_name: 'Rajesh Textiles',
      whatsapp_number: '+917863899286',
      yarn: '60s Compact',
      ends: 1400,
      meter: 6500,
      panna: 72,
      total_beam: 12,
      source: 'WHATSAPP',
      machine_id: 3,
      factory_id: 1,
      status: 'VERIFIED'
    },
    {
      date: '01-10-2026',
      time: '09:30',
      contact_name: 'Suresh Kumar',
      whatsapp_number: '+919888888888',
      yarn: '40s Carded',
      ends: 1250,
      meter: 7500,
      panna: 68,
      total_beam: 15,
      source: 'MANUAL',
      machine_id: 1,
      factory_id: 1,
      status: 'VERIFIED'
    }
  ]);

  // 7. Initial WhatsApp Connection State
  await knex('whatsapp_connections').insert({
    id: 1,
    instance_name: 'default',
    status: 'DISCONNECTED',
    phone_number: null,
    qr_code: null
  });

  // 8. Initial Audit Log
  await knex('audit_logs').insert({
    user_id: 1,
    action: 'SYSTEM_INITIALIZE',
    module: 'SYSTEM',
    entity: 'system',
    entity_id: '1',
    new_value: JSON.stringify({ message: 'Textile ERP system initialized with seed data' })
  });
};
