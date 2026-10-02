const { whatsAppSessionManager } = require('./whatsapp.connection');
const { handleIncomingMessage } = require('./whatsapp.messageHandler');
const { knex } = require('../../database/knex');
const auditService = require('../audit/audit.service');
const logger = require('../../config/logger');

class WhatsAppService {
  constructor() {
    // Wire message handler into connection
    whatsAppSessionManager.setMessageHandler(handleIncomingMessage);
  }

  async getStatus(tenantId) {
    if (!tenantId) throw new Error('TenantContextError: Missing tenantId');
    const connState = whatsAppSessionManager.getStatus(tenantId);

    // Query stats from DB
    const dbConn = await knex('whatsapp_sessions').where('tenant_id', tenantId).first();

    const [totalStats] = await knex('whatsapp_messages').where('tenant_id', tenantId).count('id as total');
    const [processedStats] = await knex('whatsapp_messages').where({ tenant_id: tenantId, status: 'PROCESSED' }).count('id as processed');
    const [invalidStats] = await knex('whatsapp_messages').where({ tenant_id: tenantId, status: 'INVALID' }).count('id as invalid');
    const [duplicateStats] = await knex('whatsapp_messages').where({ tenant_id: tenantId, status: 'DUPLICATE' }).count('id as duplicate');
    const [ignoredStats] = await knex('whatsapp_messages').where({ tenant_id: tenantId, status: 'IGNORED' }).count('id as ignored');

    return {
      connection: {
        status: connState.status,
        phoneNumber: connState.number || dbConn?.phone_number || null,
        sessionName: connState.name || dbConn?.session_name || 'Primary Gateway',
        lastConnectedAt: dbConn?.last_connected_at || null,
        hasQr: connState.hasQr,
        qrDataUrl: connState.qrDataUrl
      },
      metrics: {
        totalReceived: parseInt(totalStats?.total || 0, 10),
        processed: parseInt(processedStats?.processed || 0, 10),
        invalid: parseInt(invalidStats?.invalid || 0, 10),
        duplicate: parseInt(duplicateStats?.duplicate || 0, 10),
        ignored: parseInt(ignoredStats?.ignored || 0, 10)
      }
    };
  }

  async connect(context = {}) {
    logger.info({ tenantId: context.tenantId }, 'Manual trigger: Connecting WhatsApp...');
    await whatsAppSessionManager.initialize(context.tenantId);

    await auditService.log({
      userId: context.userId,
      action: 'CONNECT_WHATSAPP',
      module: 'WHATSAPP',
      entity: 'WHATSAPP_GATEWAY',
      ip: context.ip,
      userAgent: context.userAgent,
      tenantId: context.tenantId
    });

    return this.getStatus(context.tenantId);
  }

  async disconnect(context = {}) {
    logger.info({ tenantId: context.tenantId }, 'Manual trigger: Disconnecting WhatsApp...');
    await whatsAppSessionManager.disconnect(context.tenantId);

    await auditService.log({
      userId: context.userId,
      action: 'DISCONNECT_WHATSAPP',
      module: 'WHATSAPP',
      entity: 'WHATSAPP_GATEWAY',
      ip: context.ip,
      userAgent: context.userAgent,
      tenantId: context.tenantId
    });

    return this.getStatus(context.tenantId);
  }

  async reconnect(context = {}) {
    logger.info({ tenantId: context.tenantId }, 'Manual trigger: Reconnecting WhatsApp...');
    await whatsAppSessionManager.reconnect(context.tenantId);

    await auditService.log({
      userId: context.userId,
      action: 'RECONNECT_WHATSAPP',
      module: 'WHATSAPP',
      entity: 'WHATSAPP_GATEWAY',
      ip: context.ip,
      userAgent: context.userAgent,
      tenantId: context.tenantId
    });

    return this.getStatus(context.tenantId);
  }

  async getMessageLogs({ tenantId, page = 1, limit = 20, status, search, from, to } = {}) {
    if (!tenantId) throw new Error('TenantContextError: Missing tenantId');
    const offset = (page - 1) * limit;

    let query = knex('whatsapp_messages')
      .leftJoin('production_records', 'whatsapp_messages.production_record_id', 'production_records.id')
      .select(
        'whatsapp_messages.*',
        'production_records.yarn',
        'production_records.meter',
        'production_records.total_beam'
      )
      .where('whatsapp_messages.tenant_id', tenantId);

    let countQuery = knex('whatsapp_messages').where('tenant_id', tenantId);

    if (status && status !== 'ALL') {
      query.where('whatsapp_messages.status', status);
      countQuery.where('status', status);
    }

    if (search) {
      const searchFn = function () {
        this.where('whatsapp_messages.sender_number', 'like', `%${search}%`)
          .orWhere('whatsapp_messages.sender_name', 'like', `%${search}%`)
          .orWhere('whatsapp_messages.raw_content', 'like', `%${search}%`);
      };
      query.where(searchFn);
      countQuery.where(searchFn);
    }

    if (from) {
      query.where('whatsapp_messages.created_at', '>=', new Date(from));
      countQuery.where('created_at', '>=', new Date(from));
    }

    if (to) {
      query.where('whatsapp_messages.created_at', '<=', new Date(to));
      countQuery.where('created_at', '<=', new Date(to));
    }

    const [{ count }] = await countQuery.count('id as count');
    const total = parseInt(count, 10) || 0;

    const rows = await query
      .orderBy('whatsapp_messages.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }
}

module.exports = new WhatsAppService();
