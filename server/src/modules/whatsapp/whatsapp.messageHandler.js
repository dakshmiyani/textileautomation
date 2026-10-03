const { parseProductionMessage } = require('../../integrations/whatsapp/parser');
const { isOrderConfirmationMessage, parseOrderMessage, formatOrderReplyMessage } = require('../../integrations/whatsapp/orderParser');
const { validateProductionData } = require('../../integrations/whatsapp/validator');
const { duplicateDetector } = require('../../integrations/whatsapp/duplicateDetector');
const { defaultContactStore: contactStore } = require('../../integrations/whatsapp/contacts');
const productionService = require('../production/production.service');
const ordersService = require('../orders/orders.service');
const customersRepository = require('../customers/customers.repository');
const { knex } = require('../../database/knex');
const logger = require('../../config/logger');

/**
 * Extract clean message text from Baileys message object
 */
function extractMessageText(message) {
  if (!message) return '';
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    ''
  ).trim();
}

/**
 * Resolve the real phone number (avoiding privacy LIDs @lid)
 */
async function resolvePhoneNumber(msg, sock) {
  const remoteJid = msg.key.remoteJid || '';
  const participant = msg.key.participant || '';
  const senderJid = msg.key.fromMe ? (sock.user?.id || '') : (remoteJid.includes('@g.us') ? participant : remoteJid);

  // 1. Try Baileys remoteJidAlt if present
  if (msg.key.remoteJidAlt && msg.key.remoteJidAlt.includes('@s.whatsapp.net')) {
    return '+' + msg.key.remoteJidAlt.split('@')[0];
  }

  // 2. Try LID mapping if available in Baileys signalRepository
  if (senderJid.includes('@lid') && sock.signalRepository?.lidMapping?.getPNForLID) {
    try {
      const pn = await sock.signalRepository.lidMapping.getPNForLID(senderJid);
      if (pn) {
        return '+' + pn.split('@')[0];
      }
    } catch (err) {
      logger.debug({ error: err.message }, 'Failed to lookup phone from LID');
    }
  }

  // 3. Fallback to extracting digits from JID
  const rawId = senderJid.split('@')[0].split(':')[0];
  return rawId ? `+${rawId}` : 'Unknown';
}

/**
 * Main Baileys message handler
 */
async function handleIncomingMessage(msg, sock, tenantId) {
  // Ignore messages sent by ourselves
  if (msg.key.fromMe) return;

  const rawText = extractMessageText(msg.message);
  if (!rawText) return;

  const remoteJid = msg.key.remoteJid;
  const messageId = msg.key.id;

  // Resolve sender phone and name
  const phoneNumber = await resolvePhoneNumber(msg, sock);
  const senderName = contactStore.getSenderName({ 
    senderJid: remoteJid, 
    formattedPhone: phoneNumber, 
    pushName: msg.pushName, 
    lid: msg.key.participant 
  }) || 'WhatsApp User';

  logger.info({ remoteJid, phoneNumber, senderName, messageId }, 'Processing incoming WhatsApp message');

  // Check 1: Is this an Order Confirmation message?
  if (isOrderConfirmationMessage(rawText)) {
    logger.info({ remoteJid, phoneNumber }, 'Detected WhatsApp Order Confirmation format');

    if (duplicateDetector.isDuplicate(messageId, phoneNumber, rawText)) {
      logger.warn({ messageId, phoneNumber }, 'Duplicate order message received. Skipping processing.');
      await logWhatsAppMessage({
        message_id: messageId,
        phone_number: phoneNumber,
        sender_name: senderName,
        raw_content: rawText,
        status: 'DUPLICATE',
        tenant_id: tenantId
      });
      return;
    }

    try {
      const { order, replyMessage } = await ordersService.createFromWhatsApp({
        rawText,
        phoneNumber,
        messageId,
        senderName,
        tenantId
      });

      // Prevent infinite ping-pong loop: silently log the order in the database without replying.
      logger.info({ remoteJid, orderNo: order.order_no }, 'Silently processed WhatsApp order without sending a reply to avoid loops');

      await logWhatsAppMessage({
        message_id: messageId,
        phone_number: phoneNumber,
        sender_name: senderName,
        raw_content: rawText,
        status: 'PROCESSED',
        tenant_id: tenantId
      });
      return;
    } catch (err) {
      logger.error({ error: err.message, stack: err.stack }, 'Failed to process WhatsApp order message');
      await logWhatsAppMessage({
        message_id: messageId,
        phone_number: phoneNumber,
        sender_name: senderName,
        raw_content: rawText,
        status: 'FAILED',
        error_message: err.message,
        tenant_id: tenantId
      });
      return;
    }
  }

  // Check 2: Parse yarn production message
  const parsed = parseProductionMessage(rawText);

  // RULE: If and only if it matches the yarn production format, process and reply "ok".
  // Normal conversations must be silently ignored.
  if (!parsed) {
    logger.debug({ sender: phoneNumber }, 'Message does not match yarn production format. Silently ignoring.');
    await logWhatsAppMessage({
      message_id: messageId,
      sender_number: phoneNumber,
      sender_name: senderName,
      raw_content: rawText,
      status: 'IGNORED',
      tenant_id: tenantId
    });
    return;
  }

  // Check for duplicate messages (e.g. Baileys retry or network duplicate)
  if (duplicateDetector.isDuplicate(messageId, phoneNumber, rawText)) {
    logger.warn({ messageId, phoneNumber }, 'Duplicate production message received. Skipping processing.');
    await logWhatsAppMessage({
      message_id: messageId,
      sender_number: phoneNumber,
      sender_name: senderName,
      raw_content: rawText,
      status: 'DUPLICATE',
      tenant_id: tenantId
    });
    return;
  }

  // Look up any saved customer details by phone number or senderName
  const customerProfile = await customersRepository.findByPhoneOrName(phoneNumber, senderName, tenantId);

  const context = {
    phoneNumber,
    senderName,
    customerProfile,
    rawFields: parsed.fields
  };

  // Validate the extracted production fields with context
  const validation = validateProductionData(parsed, context);
  if (!validation.isValid) {
    logger.warn({ phoneNumber, errors: validation.errors }, 'Production message failed validation rules');
    await logWhatsAppMessage({
      message_id: messageId,
      sender_number: phoneNumber,
      sender_name: senderName,
      raw_content: rawText,
      status: 'INVALID',
      error_message: validation.errors.join('; '),
      tenant_id: tenantId
    });
    return;
  }

  // Build production record data
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  try {
    const record = await productionService.createRecord(
      {
        date: dateStr,
        time: timeStr,
        contact_name: senderName,
        whatsapp_number: phoneNumber,
        yarn: validation.data.yarn,
        ends: validation.data.ends,
        meter: validation.data.meter,
        panna: validation.data.panna,
        total_beam: validation.data.totalBeam,
        source: 'WHATSAPP',
        status: 'COMPLETED',
        whatsapp_message_id: messageId,
        raw_message: rawText
      },
      {
        source: 'WHATSAPP',
        senderNumber: phoneNumber,
        tenantId
      }
    );

    logger.info({ recordId: record.id, phoneNumber, yarn: record.yarn }, 'Production record saved successfully to PostgreSQL');

    // Persist customer profile to database
    if (validation.customerData) {
      await customersRepository.upsertCustomer({
        customer_name: validation.customerData.customer_name || senderName,
        party_name: validation.customerData.party_name,
        billing_address: validation.customerData.billing_address,
        gst_no: validation.customerData.gst_no,
        phone_number: phoneNumber,
        tenant_id: tenantId
      });
    }

    // Log processed WhatsApp message
    await logWhatsAppMessage({
      message_id: messageId,
      sender_number: phoneNumber,
      sender_name: senderName,
      raw_content: rawText,
      status: 'PROCESSED',
      production_record_id: record.id,
      tenant_id: tenantId
    });

    // Send confirmation reply back to the sender
    const replyText = validation.replyMessage || 'ok';
    await sock.sendMessage(remoteJid, { text: replyText }, { quoted: msg });
    logger.info({ remoteJid, reply: replyText }, 'Sent WhatsApp confirmation reply');
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error saving WhatsApp production record');
    await logWhatsAppMessage({
      message_id: messageId,
      sender_number: phoneNumber,
      sender_name: senderName,
      raw_content: rawText,
      status: 'FAILED',
      error_message: error.message,
      tenant_id: tenantId
    });
  }
}

async function logWhatsAppMessage(data) {
  try {
    await knex('whatsapp_messages').insert({
      message_id: data.message_id || `msg_${Date.now()}`,
      phone_number: data.sender_number || null,
      sender_name: data.sender_name || null,
      raw_text: data.raw_content || null,
      status: data.status || 'PROCESSED',
      error_message: data.error_message || null,
      production_record_id: data.production_record_id || null,
      tenant_id: data.tenant_id,
      created_at: new Date()
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to write to whatsapp_messages log table');
  }
}

module.exports = {
  handleIncomingMessage,
  extractMessageText,
  resolvePhoneNumber
};
