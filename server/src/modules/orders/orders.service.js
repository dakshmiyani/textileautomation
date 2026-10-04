/**
 * Orders Service
 * Handles order lifecycle, calculation recalculations, and WhatsApp responses
 */
const ordersRepository = require('./orders.repository');
const customersRepository = require('../customers/customers.repository');
const { calculateOrderMetrics } = require('../../integrations/whatsapp/orderCalculations');
const { parseOrderMessage, formatOrderReplyMessage } = require('../../integrations/whatsapp/orderParser');
const { whatsAppSessionManager } = require('../whatsapp/whatsapp.connection');
const logger = require('../../config/logger');

class OrdersService {
  async listOrders(filters, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    return ordersRepository.findAll({ ...filters, tenantId: context.tenantId });
  }

  async getOrderById(id, context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const order = await ordersRepository.findById(id, context.tenantId);
    if (!order) {
      const error = new Error(`Order #${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return order;
  }

  async getMetricsSummary(context = {}) {
    if (!context.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    return ordersRepository.getMetricsSummary(context.tenantId);
  }

  /**
   * Preview calculation from raw message or partial object without saving
   */
  previewCalculation(payload) {
    if (payload.raw_message) {
      return parseOrderMessage(payload.raw_message);
    }
    const calculations = calculateOrderMetrics(payload);
    const replyMessage = formatOrderReplyMessage(payload, calculations);
    return {
      ...payload,
      calculations,
      reply_message: replyMessage
    };
  }

  /**
   * Create an order directly from WhatsApp message
   */
  async createFromWhatsApp({ rawText, phoneNumber, messageId, senderName, tenantId }) {
    if (!tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const parsed = parseOrderMessage(rawText);
    if (!parsed) {
      throw new Error('Message could not be parsed as an order confirmation');
    }

    const customerProfile = await customersRepository.findByPhoneOrName(phoneNumber, senderName, tenantId);

    const customerName = parsed.customer_name || customerProfile?.customer_name || senderName || 'Asmita miyani';
    const partyName = parsed.party_name || customerProfile?.party_name || senderName || 'YOGI TEX FAB';
    const billingAddress = parsed.billing_address || customerProfile?.billing_address || 'Plot No. 12-13, Jalbhumi Industrial, Olpad Sayan Road, Surat, Gujarat - 394130';
    const gstNo = parsed.gst_no || customerProfile?.gst_no || '-';

    parsed.customer_name = customerName;
    parsed.party_name = partyName;
    parsed.billing_address = billingAddress;
    parsed.gst_no = gstNo;

    // Persist to customers directory
    await customersRepository.upsertCustomer({
      customer_name: customerName,
      party_name: partyName,
      billing_address: billingAddress,
      gst_no: gstNo,
      phone_number: phoneNumber,
      tenant_id: tenantId
    });

    const calculations = parsed.calculations;
    const replyMessage = formatOrderReplyMessage(parsed, calculations);

    const recordData = {
      order_no: parsed.order_no || `SO-${Date.now()}`,
      order_date: parsed.order_date,
      mill_name: parsed.mill_name,
      customer_name: customerName,
      party_name: partyName,
      billing_address: billingAddress,
      gst_no: gstNo,
      item_name: parsed.item_name,
      ends: calculations.ends,
      panna: calculations.panna,
      denier: calculations.denier,
      beam_count: calculations.beamCount,
      meter_per_beam: calculations.meterPerBeam,
      total_meters: calculations.totalMeters,
      weight_per_beam_kg: calculations.weightPerBeamKg,
      total_weight_kg: calculations.totalWeightKg,
      rate: calculations.rate,
      rate_type: calculations.rateType,
      rate_note: calculations.rateNote,
      basic_amount: calculations.basicAmount,
      cartage_rate: calculations.cartageRate,
      cartage_total: calculations.cartageTotal,
      out_beam_rate: calculations.outBeamRate,
      out_beam_total: calculations.outBeamTotal,
      subtotal: calculations.subtotal,
      gst_percent: calculations.gstPercent,
      gst_amount: calculations.gstAmount,
      grand_total: calculations.grandTotal,
      terms: parsed.terms,
      delivery: parsed.delivery,
      notes: parsed.notes,
      status: 'CONFIRMED',
      source: 'WHATSAPP',
      whatsapp_number: phoneNumber,
      whatsapp_message_id: messageId,
      raw_message: rawText,
      reply_message: replyMessage,
      tenant_id: tenantId
    };

    const savedOrder = await ordersRepository.create(recordData);
    logger.info({ orderId: savedOrder.id, orderNo: savedOrder.order_no }, 'Saved new order from WhatsApp');

    return {
      order: savedOrder,
      replyMessage
    };
  }

  /**
   * Manual creation of order from ERP Dashboard
   */
  async createOrder(payload, userContext = {}) {
    if (!userContext.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const customerName = payload.customer_name || null;
    const partyName = payload.party_name || null;
    const billingAddress = payload.billing_address || null;
    const gstNo = payload.gst_no || null;

    if (partyName || customerName) {
      await customersRepository.upsertCustomer({
        customer_name: customerName,
        party_name: partyName,
        billing_address: billingAddress,
        gst_no: gstNo,
        phone_number: payload.whatsapp_number || null,
        tenant_id: userContext.tenantId
      });
    }

    const calculations = calculateOrderMetrics(payload);
    const replyMessage = formatOrderReplyMessage({ ...payload, customer_name: customerName }, calculations);

    const recordData = {
      order_no: payload.order_no || `SO-${Date.now().toString().slice(-6)}`,
      order_date: payload.order_date || new Date().toISOString().split('T')[0],
      mill_name: payload.mill_name || 'KESARI NANDAN TEX FAB',
      customer_name: customerName,
      party_name: partyName,
      billing_address: billingAddress,
      gst_no: gstNo,
      item_name: payload.item_name,
      ends: calculations.ends,
      panna: calculations.panna,
      denier: calculations.denier,
      beam_count: calculations.beamCount,
      meter_per_beam: calculations.meterPerBeam,
      total_meters: calculations.totalMeters,
      weight_per_beam_kg: calculations.weightPerBeamKg,
      total_weight_kg: calculations.totalWeightKg,
      rate: calculations.rate,
      rate_type: calculations.rateType,
      rate_note: payload.rate_note || '++',
      basic_amount: calculations.basicAmount,
      cartage_rate: calculations.cartageRate,
      cartage_total: calculations.cartageTotal,
      out_beam_rate: calculations.outBeamRate,
      out_beam_total: calculations.outBeamTotal,
      subtotal: calculations.subtotal,
      gst_percent: calculations.gstPercent,
      gst_amount: calculations.gstAmount,
      grand_total: calculations.grandTotal,
      terms: payload.terms || null,
      delivery: payload.delivery || null,
      notes: payload.notes || null,
      status: payload.status || 'CONFIRMED',
      source: payload.source || 'MANUAL',
      whatsapp_number: payload.whatsapp_number || null,
      raw_message: payload.raw_message || null,
      reply_message: replyMessage,
      tenant_id: userContext.tenantId
    };

    return ordersRepository.create(recordData);
  }

  /**
   * Update an existing order and recalculate all metrics
   */
  async updateOrder(id, payload, userContext = {}) {
    if (!userContext.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    const existing = await this.getOrderById(id, userContext);

    const merged = {
      ...existing,
      ...payload
    };

    if (merged.party_name || merged.customer_name) {
      await customersRepository.upsertCustomer({
        customer_name: merged.customer_name || null,
        party_name: merged.party_name || null,
        billing_address: merged.billing_address,
        gst_no: merged.gst_no,
        phone_number: merged.whatsapp_number || null,
        tenant_id: userContext.tenantId
      });
    }

    // Recalculate metrics based on updated fields
    const calculations = calculateOrderMetrics(merged);
    const replyMessage = formatOrderReplyMessage(merged, calculations);

    const updateData = {
      order_no: merged.order_no,
      order_date: merged.order_date,
      mill_name: merged.mill_name,
      customer_name: merged.customer_name || null,
      party_name: merged.party_name,
      billing_address: merged.billing_address,
      gst_no: merged.gst_no,
      item_name: merged.item_name,
      ends: calculations.ends,
      panna: calculations.panna,
      denier: calculations.denier,
      beam_count: calculations.beamCount,
      meter_per_beam: calculations.meterPerBeam,
      total_meters: calculations.totalMeters,
      weight_per_beam_kg: calculations.weightPerBeamKg,
      total_weight_kg: calculations.totalWeightKg,
      rate: calculations.rate,
      rate_type: calculations.rateType,
      rate_note: merged.rate_note || '++',
      basic_amount: calculations.basicAmount,
      cartage_rate: calculations.cartageRate,
      cartage_total: calculations.cartageTotal,
      out_beam_rate: calculations.outBeamRate,
      out_beam_total: calculations.outBeamTotal,
      subtotal: calculations.subtotal,
      gst_percent: calculations.gstPercent,
      gst_amount: calculations.gstAmount,
      grand_total: calculations.grandTotal,
      terms: merged.terms,
      delivery: merged.delivery,
      notes: merged.notes,
      status: merged.status,
      whatsapp_number: merged.whatsapp_number,
      reply_message: replyMessage
    };

    return ordersRepository.update(id, updateData, userContext.tenantId);
  }

  async deleteOrder(id, userContext = {}) {
    if (!userContext.tenantId) throw new Error('TenantContextError: Missing tenantId in service');
    await this.getOrderById(id, userContext);
    return ordersRepository.delete(id, userContext.tenantId);
  }

  /**
   * Send or re-send the order confirmation reply to the party via WhatsApp
   */
  async sendOrderWhatsAppReply(id, customPhone = null, userContext = {}) {
    const order = await this.getOrderById(id, userContext);
    const targetPhone = customPhone || order.whatsapp_number;

    if (!targetPhone) {
      const error = new Error('No WhatsApp phone number provided for this order');
      error.statusCode = 400;
      throw error;
    }

    const session = whatsAppSessionManager._getSession(userContext.tenantId);
    const sock = session?.sock;
    if (!sock || session.status !== 'CONNECTED') {
      const error = new Error('WhatsApp Gateway is currently disconnected. Please connect WhatsApp in WhatsApp Gateway tab.');
      error.statusCode = 503;
      throw error;
    }

    // Format target JID
    const cleanDigits = targetPhone.replace(/[^0-9]/g, '');
    const remoteJid = `${cleanDigits}@s.whatsapp.net`;

    const textToSend = order.reply_message || formatOrderReplyMessage(order);

    await sock.sendMessage(remoteJid, { text: textToSend });
    logger.info({ orderId: order.id, remoteJid }, 'Sent WhatsApp order confirmation reply');

    return {
      success: true,
      sentTo: targetPhone,
      message: textToSend
    };
  }
}

module.exports = new OrdersService();
