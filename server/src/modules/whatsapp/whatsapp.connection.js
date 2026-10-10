const fs = require('fs');
const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const env = require('../../config/env');
const logger = require('../../config/logger');
const { defaultContactStore: contactStore } = require('../../integrations/whatsapp/contacts');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const { knex } = require('../../database/knex');

class WhatsAppSessionManager {
  constructor() {
    this.sessions = new Map(); // tenantId -> sessionObj
    this.messageHandler = null;
  }

  setMessageHandler(handler) {
    this.messageHandler = handler;
  }

  _getSession(tenantId) {
    if (!this.sessions.has(tenantId)) {
      this.sessions.set(tenantId, {
        sock: null,
        status: 'DISCONNECTED', // DISCONNECTED, CONNECTING, CONNECTED, QR_READY
        qrCode: null,
        qrCodeDataUrl: null,
        connectedNumber: null,
        connectedName: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 10,
        isManualDisconnect: false
      });
    }
    return this.sessions.get(tenantId);
  }

  async initialize(tenantId) {
    const session = this._getSession(tenantId);
    const authDir = path.resolve(env.WHATSAPP_AUTH_DIR, `tenant_${tenantId}`);
    
    logger.info({ authDir, tenantId }, 'Initializing WhatsApp Baileys connection for tenant...');

    session.status = 'CONNECTING';
    session.isManualDisconnect = false;
    eventBus.emitEvent(EVENTS.WHATSAPP_CONNECTION_CHANGED, { status: session.status, tenantId });

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      const { version } = await fetchLatestBaileysVersion();

      const baileysLogger = logger.child({ module: 'baileys', tenantId });
      baileysLogger.level = 'warn'; // Suppress noisy info/trace logs (like identity changes)

      session.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: baileysLogger,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false
      });

      session.sock.ev.on('creds.update', saveCreds);

      session.sock.ev.on('contacts.upsert', (contacts) => {
        contactStore.upsertContacts(contacts);
      });

      session.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          session.status = 'QR_READY';
          session.qrCode = qr;
          try {
            session.qrCodeDataUrl = await qrcode.toDataURL(qr);
            const qrcodeTerminal = require('qrcode-terminal');
            qrcodeTerminal.generate(qr, { small: true });
          } catch {
            session.qrCodeDataUrl = null;
          }
          logger.info({ tenantId }, 'WhatsApp QR Code generated, ready for pairing');
          eventBus.emitEvent(EVENTS.WHATSAPP_QR_RECEIVED, { qr, qrDataUrl: session.qrCodeDataUrl, tenantId });
          eventBus.emitEvent(EVENTS.WHATSAPP_CONNECTION_CHANGED, { status: session.status, qr, tenantId });
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error instanceof Boom)
            ? lastDisconnect.error.output?.statusCode
            : lastDisconnect?.error?.code;

          const shouldReconnect = !session.isManualDisconnect && statusCode !== DisconnectReason.loggedOut;

          session.status = 'DISCONNECTED';
          session.qrCode = null;
          session.qrCodeDataUrl = null;
          logger.warn({ statusCode, shouldReconnect, tenantId }, 'WhatsApp connection closed');
          eventBus.emitEvent(EVENTS.WHATSAPP_CONNECTION_CHANGED, { status: session.status, tenantId });

          await this.updateConnectionDb(tenantId, {
            status: 'DISCONNECTED',
            notes: `Connection closed: ${statusCode || 'unknown'}`
          });

          if (statusCode === DisconnectReason.loggedOut) {
            logger.warn({ tenantId }, 'WhatsApp session logged out. Clearing authentication data...');
            try {
              if (fs.existsSync(authDir)) {
                fs.rmSync(authDir, { recursive: true, force: true });
                logger.info({ tenantId }, 'WhatsApp auth data cleared. A new QR code will be generated on reconnect.');
              }
            } catch (err) {
              logger.error({ error: err.message, tenantId }, 'Failed to clear WhatsApp auth data');
            }
          } else if (shouldReconnect) {
            this.scheduleReconnect(tenantId);
          }
        } else if (connection === 'open') {
          session.status = 'CONNECTED';
          session.reconnectAttempts = 0;
          session.qrCode = null;
          session.qrCodeDataUrl = null;

          const userJid = session.sock.user?.id || '';
          session.connectedNumber = userJid.split(':')[0] || userJid.split('@')[0];
          session.connectedName = session.sock.user?.name || 'Textile ERP WhatsApp Gateway';

          logger.info({ number: session.connectedNumber, name: session.connectedName, tenantId }, 'WhatsApp connected successfully');
          eventBus.emitEvent(EVENTS.WHATSAPP_CONNECTION_CHANGED, {
            status: session.status,
            number: session.connectedNumber,
            name: session.connectedName,
            tenantId
          });

          await this.updateConnectionDb(tenantId, {
            status: 'CONNECTED',
            phone_number: session.connectedNumber,
            instance_name: session.connectedName || 'default',
            last_connected_at: new Date(),
            notes: 'Connected via Baileys Multi-File Auth'
          });
        }
      });

      session.sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify' && this.messageHandler) {
          for (const msg of m.messages) {
            try {
              // Pass tenantId context to the message handler
              await this.messageHandler(msg, session.sock, tenantId);
            } catch (err) {
              logger.error({ error: err.message, stack: err.stack, tenantId }, 'Error in messageHandler');
            }
          }
        }
      });

      return session.sock;
    } catch (err) {
      session.status = 'DISCONNECTED';
      logger.error({ error: err.message, stack: err.stack, tenantId }, 'Failed to initialize WhatsApp connection');
      eventBus.emitEvent(EVENTS.WHATSAPP_CONNECTION_CHANGED, { status: session.status, error: err.message, tenantId });
      throw err;
    }
  }

  scheduleReconnect(tenantId) {
    const session = this._getSession(tenantId);
    if (session.reconnectAttempts >= session.maxReconnectAttempts) {
      logger.error({ tenantId }, 'Max WhatsApp reconnect attempts reached. Manual intervention required.');
      return;
    }

    session.reconnectAttempts += 1;
    const delay = Math.min(session.reconnectAttempts * 3000, 30000);
    logger.info({ attempt: session.reconnectAttempts, delayMs: delay, tenantId }, 'Scheduling WhatsApp reconnect...');

    setTimeout(() => {
      this.initialize(tenantId).catch((err) => {
        logger.error({ error: err.message, tenantId }, 'WhatsApp reconnection failed');
      });
    }, delay);
  }

  async disconnect(tenantId, logout = false) {
    const session = this._getSession(tenantId);
    session.isManualDisconnect = true;
    if (session.sock) {
      if (logout) {
        try {
          await session.sock.logout();
        } catch (err) {
          logger.warn({ error: err.message, tenantId }, 'Error during WhatsApp socket logout');
        }
      }
      session.sock.end();
      session.sock = null;
    }
    session.status = 'DISCONNECTED';
    session.qrCode = null;
    session.qrCodeDataUrl = null;
    eventBus.emitEvent(EVENTS.WHATSAPP_CONNECTION_CHANGED, { status: session.status, tenantId });
    await this.updateConnectionDb(tenantId, { status: 'DISCONNECTED', notes: 'Manually disconnected by user' });
    return { success: true, message: 'WhatsApp disconnected' };
  }

  async reconnect(tenantId) {
    await this.disconnect(tenantId);
    const session = this._getSession(tenantId);
    session.isManualDisconnect = false;
    return this.initialize(tenantId);
  }

  getStatus(tenantId) {
    const session = this._getSession(tenantId);
    return {
      status: session.status,
      number: session.connectedNumber,
      name: session.connectedName,
      hasQr: !!session.qrCode,
      qrDataUrl: session.qrCodeDataUrl
    };
  }

  async updateConnectionDb(tenantId, data) {
    try {
      const existing = await knex('whatsapp_sessions').where({ tenant_id: tenantId }).first();
      if (existing) {
        await knex('whatsapp_sessions')
          .where('id', existing.id)
          .update({
            ...data,
            updated_at: new Date()
          });
      } else {
        await knex('whatsapp_sessions').insert({
          tenant_id: tenantId,
          session_key: `tenant_${tenantId}`,
          instance_name: data.instance_name || `Tenant ${tenantId} Gateway`,
          phone_number: data.phone_number || null,
          status: data.status,
          last_connected_at: data.last_connected_at || null,
          notes: data.notes || null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    } catch (err) {
      logger.error({ error: err.message, tenantId }, 'Failed to update whatsapp_sessions table');
    }
  }
}

const whatsAppSessionManager = new WhatsAppSessionManager();
module.exports = { whatsAppSessionManager };
