/**
 * Orders Repository
 * Database access layer for Textile ERP Sales Orders & Calculations
 */
const { knex } = require('../../database/knex');

class OrdersRepository {
  _enforceTenant(tenantId) {
    if (!tenantId) throw new Error('TenantContextError: Missing tenantId');
  }

  async findAll({ tenantId, page = 1, limit = 20, search = '', status = 'ALL', sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    this._enforceTenant(tenantId);
    const offset = (page - 1) * limit;

    let query = knex('orders').where({ tenant_id: tenantId }).select('*');
    let countQuery = knex('orders').where({ tenant_id: tenantId }).count('* as total').first();

    if (search) {
      const s = `%${search.trim()}%`;
      const searchFilter = function() {
        this.whereILike('order_no', s)
          .orWhereILike('party_name', s)
          .orWhereILike('customer_name', s)
          .orWhereILike('item_name', s)
          .orWhereILike('mill_name', s)
          .orWhereILike('whatsapp_number', s);
      };
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }

    if (status && status !== 'ALL') {
      query = query.where('status', status);
      countQuery = countQuery.where('status', status);
    }

    // Apply sorting
    const validSortCols = ['created_at', 'order_date', 'order_no', 'party_name', 'total_meters', 'grand_total', 'status'];
    const safeSort = validSortCols.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    query = query.orderBy(safeSort, safeOrder).limit(limit).offset(offset);

    const [records, countResult] = await Promise.all([query, countQuery]);
    const total = parseInt(countResult?.total || 0, 10);

    return {
      data: records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id, tenantId) {
    this._enforceTenant(tenantId);
    return knex('orders').where({ id, tenant_id: tenantId }).first();
  }

  async findByOrderNo(orderNo, tenantId) {
    this._enforceTenant(tenantId);
    return knex('orders').where({ order_no: orderNo, tenant_id: tenantId }).first();
  }

  async create(orderData) {
    this._enforceTenant(orderData.tenant_id);
    const [record] = await knex('orders')
      .insert({
        ...orderData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return record || (await this.findById(orderData.id, orderData.tenant_id));
  }

  async update(id, updateData, tenantId) {
    this._enforceTenant(tenantId);
    const [record] = await knex('orders')
      .where({ id, tenant_id: tenantId })
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');
    
    return record || (await this.findById(id, tenantId));
  }

  async delete(id, tenantId) {
    this._enforceTenant(tenantId);
    return knex('orders').where({ id, tenant_id: tenantId }).del();
  }

  async getMetricsSummary(tenantId) {
    this._enforceTenant(tenantId);
    const stats = await knex('orders')
      .where({ tenant_id: tenantId })
      .select(
        knex.raw('COUNT(*) as total_orders'),
        knex.raw("SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_orders"),
        knex.raw('COALESCE(SUM(total_meters), 0) as total_meters'),
        knex.raw('COALESCE(SUM(total_weight_kg), 0) as total_weight_kg'),
        knex.raw('COALESCE(SUM(grand_total), 0) as total_value'),
        knex.raw('COALESCE(SUM(beam_count), 0) as total_beams')
      )
      .first();

    return {
      totalOrders: Number(stats?.total_orders || 0),
      confirmedOrders: Number(stats?.confirmed_orders || 0),
      totalMeters: parseFloat(stats?.total_meters || 0),
      totalWeightKg: parseFloat(stats?.total_weight_kg || 0),
      totalValue: parseFloat(stats?.total_value || 0),
      totalBeams: Number(stats?.total_beams || 0)
    };
  }
}

module.exports = new OrdersRepository();
