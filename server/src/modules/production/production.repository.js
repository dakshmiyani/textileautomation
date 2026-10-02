const { knex } = require('../../database/knex');

class ProductionRepository {
  _enforceTenant(tenantId) {
    if (!tenantId) throw new Error('TenantContextError: Missing tenantId');
  }

  /**
   * Insert a new production record
   */
  async create(data) {
    this._enforceTenant(data.tenant_id);
    const [record] = await knex('production_records')
      .insert({
        company_id: data.company_id || null,
        factory_id: data.factory_id || null,
        machine_id: data.machine_id || null,
        tenant_id: data.tenant_id,
        date: data.date,
        time: data.time,
        contact_name: data.contact_name || null,
        whatsapp_number: data.whatsapp_number || null,
        yarn: data.yarn,
        ends: data.ends,
        meter: data.meter,
        panna: data.panna,
        total_beam: data.total_beam,
        source: data.source || 'MANUAL',
        status: data.status || 'COMPLETED',
        whatsapp_message_id: data.whatsapp_message_id || null,
        raw_message: data.raw_message || null,
        notes: data.notes || null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return record;
  }

  /**
   * Find record by ID
   */
  async findById(id, tenantId) {
    this._enforceTenant(tenantId);
    return knex('production_records')
      .leftJoin('machines', 'production_records.machine_id', 'machines.id')
      .select(
        'production_records.*',
        'machines.code as machine_code',
        'machines.name as machine_name'
      )
      .where('production_records.id', id)
      .andWhere('production_records.tenant_id', tenantId)
      .first();
  }

  /**
   * Update record by ID
   */
  async update(id, data, tenantId) {
    this._enforceTenant(tenantId);
    const [record] = await knex('production_records')
      .where({ id, tenant_id: tenantId })
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');

    return record;
  }

  /**
   * Delete record by ID
   */
  async delete(id, tenantId) {
    this._enforceTenant(tenantId);
    return knex('production_records')
      .where({ id, tenant_id: tenantId })
      .del();
  }

  /**
   * Paginated list with search and filters
   */
  async findPaginated({
    tenantId,
    page = 1,
    limit = 20,
    search,
    sortBy = 'date',
    sortOrder = 'desc',
    from,
    to,
    yarn,
    source,
    status,
    machineId
  } = {}) {
    this._enforceTenant(tenantId);
    const offset = (page - 1) * limit;

    let query = knex('production_records')
      .leftJoin('machines', 'production_records.machine_id', 'machines.id')
      .select(
        'production_records.*',
        'machines.code as machine_code',
        'machines.name as machine_name'
      )
      .where('production_records.tenant_id', tenantId);

    let countQuery = knex('production_records').where('tenant_id', tenantId);

    // Filter helper
    const applyFilters = (q) => {
      if (search) {
        q.where(function () {
          this.where('production_records.yarn', 'like', `%${search}%`)
            .orWhere('production_records.contact_name', 'like', `%${search}%`)
            .orWhere('production_records.whatsapp_number', 'like', `%${search}%`);
        });
      }
      if (yarn) {
        q.where('production_records.yarn', yarn);
      }
      if (source && source !== 'ALL') {
        q.where('production_records.source', source);
      }
      if (status && status !== 'ALL') {
        q.where('production_records.status', status);
      }
      if (machineId) {
        q.where('production_records.machine_id', machineId);
      }
      if (from) {
        q.where('production_records.date', '>=', from);
      }
      if (to) {
        q.where('production_records.date', '<=', to);
      }
    };

    applyFilters(query);
    applyFilters(countQuery);

    const [{ count }] = await countQuery.count('id as count');
    const total = parseInt(count, 10) || 0;

    // Apply sorting
    const validSortCols = {
      date: 'production_records.date',
      created_at: 'production_records.created_at',
      yarn: 'production_records.yarn',
      meter: 'production_records.meter',
      total_beam: 'production_records.total_beam',
      contact_name: 'production_records.contact_name'
    };
    const sortCol = validSortCols[sortBy] || 'production_records.date';
    const direction = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const records = await query
      .orderBy(sortCol, direction)
      .orderBy('production_records.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Find all records matching filter for export
   */
  async findAllForExport({ tenantId, from, to, yarn, source, status } = {}) {
    this._enforceTenant(tenantId);
    let query = knex('production_records')
      .leftJoin('machines', 'production_records.machine_id', 'machines.id')
      .select(
        'production_records.*',
        'machines.code as machine_code',
        'machines.name as machine_name'
      );

    query.where('production_records.tenant_id', tenantId);

    if (from) query.where('production_records.date', '>=', from);
    if (to) query.where('production_records.date', '<=', to);
    if (yarn) query.where('production_records.yarn', yarn);
    if (source && source !== 'ALL') query.where('production_records.source', source);
    if (status && status !== 'ALL') query.where('production_records.status', status);

    return query.orderBy('production_records.date', 'asc').orderBy('production_records.created_at', 'asc');
  }

  /**
   * Calculate KPIs
   */
  async getKPIs(tenantId) {
    this._enforceTenant(tenantId);
    const today = new Date().toISOString().split('T')[0];

    // Today's production
    const todayStats = await knex('production_records')
      .where({ date: today, tenant_id: tenantId })
      .sum('meter as today_meters')
      .sum('total_beam as today_beams')
      .count('id as today_records')
      .first();

    // Total production all-time
    const allStats = await knex('production_records')
      .where({ tenant_id: tenantId })
      .sum('meter as total_meters')
      .sum('total_beam as total_beams')
      .count('id as total_records')
      .first();

    // Active machines count
    const activeMachines = await knex('machines')
      .where({ status: 'ACTIVE', tenant_id: tenantId })
      .count('id as active_count')
      .first();

    // Total WhatsApp submissions
    const whatsappCount = await knex('production_records')
      .where({ source: 'WHATSAPP', tenant_id: tenantId })
      .count('id as count')
      .first();

    return {
      today: {
        date: today,
        meters: parseFloat(todayStats?.today_meters || 0),
        beams: parseInt(todayStats?.today_beams || 0, 10),
        records: parseInt(todayStats?.today_records || 0, 10)
      },
      overall: {
        meters: parseFloat(allStats?.total_meters || 0),
        beams: parseInt(allStats?.total_beams || 0, 10),
        records: parseInt(allStats?.total_records || 0, 10)
      },
      activeMachines: parseInt(activeMachines?.active_count || 0, 10),
      whatsappSubmissions: parseInt(whatsappCount?.count || 0, 10)
    };
  }

  /**
   * Analytics: Production grouped by day (last 14 or 30 days)
   */
  async getProductionByDay(tenantId, limit = 14) {
    this._enforceTenant(tenantId);
    const rows = await knex('production_records')
      .where({ tenant_id: tenantId })
      .select('date')
      .sum('meter as meters')
      .sum('total_beam as beams')
      .count('id as batches')
      .groupBy('date')
      .orderBy('date', 'desc')
      .limit(limit);

    return rows.reverse().map((r) => ({
      date: r.date,
      meters: parseFloat(r.meters || 0),
      beams: parseInt(r.beams || 0, 10),
      batches: parseInt(r.batches || 0, 10)
    }));
  }

  /**
   * Analytics: Production grouped by yarn type
   */
  async getProductionByYarn(tenantId, limit = 5) {
    this._enforceTenant(tenantId);
    const rows = await knex('production_records')
      .where({ tenant_id: tenantId })
      .select('yarn')
      .sum('meter as meters')
      .sum('total_beam as beams')
      .count('id as batches')
      .groupBy('yarn')
      .orderBy('meters', 'desc')
      .limit(limit);

    return rows.map((r) => ({
      yarn: r.yarn,
      meters: parseFloat(r.meters || 0),
      beams: parseInt(r.beams || 0, 10),
      batches: parseInt(r.batches || 0, 10)
    }));
  }

  /**
   * Analytics: Production grouped by worker/contact
   */
  async getProductionByWorker(tenantId, limit = 5) {
    this._enforceTenant(tenantId);
    const rows = await knex('production_records')
      .where({ tenant_id: tenantId })
      .select('contact_name', 'whatsapp_number')
      .sum('meter as meters')
      .sum('total_beam as beams')
      .count('id as batches')
      .whereNotNull('contact_name')
      .groupBy('contact_name', 'whatsapp_number')
      .orderBy('meters', 'desc')
      .limit(limit);

    return rows.map((r) => ({
      worker: r.contact_name || r.whatsapp_number || 'Unknown',
      whatsapp: r.whatsapp_number,
      meters: parseFloat(r.meters || 0),
      beams: parseInt(r.beams || 0, 10),
      batches: parseInt(r.batches || 0, 10)
    }));
  }
}

module.exports = new ProductionRepository();
