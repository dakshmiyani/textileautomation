const productionRepository = require('./production.repository');
const auditService = require('../audit/audit.service');
const { generateProductionWorkbookBuffer } = require('../../integrations/excel/excelExport');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const { NotFoundError } = require('../../middleware/error.middleware');
const logger = require('../../config/logger');

class ProductionService {
  /**
   * Create a production record (from WhatsApp, API, or Manual Entry)
   */
  async createRecord(data, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const now = new Date();
    const recordData = {
      date: data.date || now.toISOString().split('T')[0],
      time: data.time || now.toLocaleTimeString('en-US', { hour12: true }),
      yarn: data.yarn,
      ends: Number(data.ends),
      meter: Number(data.meter),
      panna: Number(data.panna),
      total_beam: Number(data.total_beam),
      contact_name: data.contact_name || null,
      whatsapp_number: data.whatsapp_number || null,
      machine_id: data.machine_id || null,
      source: data.source || 'MANUAL',
      status: data.status || 'COMPLETED',
      whatsapp_message_id: data.whatsapp_message_id || null,
      raw_message: data.raw_message || null,
      notes: data.notes || null,
      company_id: context.companyId || null,
      factory_id: context.factoryId || null,
      tenant_id: context.tenantId
    };

    const record = await productionRepository.create(recordData);

    // Audit trail
    if (context.userId || context.source === 'WHATSAPP') {
      await auditService.log({
        userId: context.userId || null,
        action: 'CREATE_PRODUCTION_RECORD',
        module: 'PRODUCTION',
        entity: 'PRODUCTION_RECORD',
        entityId: record.id,
        newValue: record,
        ip: context.ip,
        userAgent: context.userAgent
      });
    }

    // Emit event for inventory/analytics/notifications
    eventBus.emitEvent(EVENTS.PRODUCTION_CREATED, { record, context });

    // Automatically create an order from this production record
    try {
      const ordersService = require('../orders/orders.service');
      const customersRepository = require('../customers/customers.repository');
      
      let customerName = record.contact_name || 'New Customer';
      let partyName = record.contact_name || 'New Party';
      let billingAddress = '';
      let gstNo = '';
      
      if (record.whatsapp_number) {
        const profile = await customersRepository.findByPhoneOrName(record.whatsapp_number, record.contact_name);
        if (profile) {
          if (profile.customer_name) customerName = profile.customer_name;
          if (profile.party_name) partyName = profile.party_name;
          if (profile.billing_address) billingAddress = profile.billing_address;
          if (profile.gst_no) gstNo = profile.gst_no;
        }
      }

      const orderPayload = {
        customer_name: customerName,
        party_name: partyName,
        billing_address: billingAddress,
        gst_no: gstNo,
        item_name: record.yarn,
        ends: record.ends,
        panna: record.panna,
        beam_count: record.total_beam,
        meter_per_beam: record.meter,
        total_meters: record.total_beam * record.meter,
        whatsapp_number: record.whatsapp_number,
        source: 'AUTO_GENERATED',
        status: 'CONFIRMED',
        notes: `Auto-generated from Yarn Production #${record.id}`,
        // Defaults based on common usage
        rate: 300,
        rate_note: '++',
        cartage_rate: 800,
        out_beam_rate: 400
      };
      
      const savedOrder = await ordersService.createOrder(orderPayload, context);
      logger.info({ orderId: savedOrder.id, tenantId: context.tenantId }, 'Auto-created order from yarn production');
    } catch (orderErr) {
      logger.error({ error: orderErr.message, tenantId: context.tenantId }, 'Failed to auto-create order from production record');
    }

    return record;
  }

  /**
   * Get record by ID
   */
  async getRecordById(id, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const record = await productionRepository.findById(id, context.tenantId);
    if (!record) {
      throw new NotFoundError(`Production record #${id} not found`);
    }
    return record;
  }

  /**
   * Update production record
   */
  async updateRecord(id, updateData, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const existing = await this.getRecordById(id, context);

    const updated = await productionRepository.update(id, updateData, context.tenantId);

    await auditService.log({
      userId: context.userId,
      tenantId: context.tenantId,
      action: 'UPDATE_PRODUCTION_RECORD',
      module: 'PRODUCTION',
      entity: 'PRODUCTION_RECORD',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ip: context.ip,
      userAgent: context.userAgent
    });

    eventBus.emitEvent(EVENTS.PRODUCTION_UPDATED, { record: updated, previous: existing, context });

    return updated;
  }

  /**
   * Delete production record
   */
  async deleteRecord(id, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const existing = await this.getRecordById(id, context);

    await productionRepository.delete(id, context.tenantId);

    await auditService.log({
      userId: context.userId,
      tenantId: context.tenantId,
      action: 'DELETE_PRODUCTION_RECORD',
      module: 'PRODUCTION',
      entity: 'PRODUCTION_RECORD',
      entityId: id,
      oldValue: existing,
      ip: context.ip,
      userAgent: context.userAgent
    });

    eventBus.emitEvent(EVENTS.PRODUCTION_DELETED, { recordId: id, context });

    return { message: 'Production record deleted successfully' };
  }

  /**
   * List paginated production records
   */
  async listRecords(filters, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    return productionRepository.findPaginated({ ...filters, tenantId: context.tenantId });
  }

  /**
   * Get Production Dashboard KPIs
   */
  async getKPIs(context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    return productionRepository.getKPIs(context.tenantId);
  }

  /**
   * Get Production Dashboard charts & analytics
   */
  async getAnalytics({ days = 14 } = {}, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const [byDay, byYarn, byWorker] = await Promise.all([
      productionRepository.getProductionByDay(context.tenantId, days),
      productionRepository.getProductionByYarn(context.tenantId, 5),
      productionRepository.getProductionByWorker(context.tenantId, 5)
    ]);

    return {
      byDay,
      byYarn,
      byWorker
    };
  }

  /**
   * Export records to Excel buffer
   */
  async exportExcel(filters, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const records = await productionRepository.findAllForExport({ ...filters, tenantId: context.tenantId });
    const buffer = await generateProductionWorkbookBuffer(records);

    await auditService.log({
      userId: context.userId,
      tenantId: context.tenantId,
      action: 'EXPORT_PRODUCTION_EXCEL',
      module: 'PRODUCTION',
      entity: 'PRODUCTION_RECORD',
      newValue: { count: records.length, filters },
      ip: context.ip,
      userAgent: context.userAgent
    });

    return buffer;
  }
}

module.exports = new ProductionService();
