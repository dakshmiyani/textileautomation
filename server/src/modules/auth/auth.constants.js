const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER'
};

const PERMISSIONS = {
  // Production permissions
  PRODUCTION_READ: 'production.read',
  PRODUCTION_CREATE: 'production.create',
  PRODUCTION_UPDATE: 'production.update',
  PRODUCTION_DELETE: 'production.delete',

  // Inventory permissions
  INVENTORY_READ: 'inventory.read',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',

  // WhatsApp permissions
  WHATSAPP_READ: 'whatsapp.read',
  WHATSAPP_MANAGE: 'whatsapp.manage',

  // Reports & Analytics permissions
  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',

  // User & System Management
  USERS_MANAGE: 'users.manage',
  AUDIT_READ: 'audit.read'
};

module.exports = {
  ROLES,
  PERMISSIONS
};
