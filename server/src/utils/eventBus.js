const EventEmitter = require('events');
const logger = require('../config/logger');

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.on('error', (err) => {
      logger.error({ error: err.message, stack: err.stack }, 'Unhandled event bus error');
    });
  }

  emitEvent(eventName, payload) {
    logger.debug({ eventName, payload }, 'Event emitted');
    this.emit(eventName, payload);
  }
}

const eventBus = new AppEventBus();

// Core system event names
const EVENTS = {
  PRODUCTION_CREATED: 'production.created',
  PRODUCTION_UPDATED: 'production.updated',
  PRODUCTION_DELETED: 'production.deleted',
  WHATSAPP_MESSAGE_RECEIVED: 'whatsapp.message.received',
  WHATSAPP_CONNECTION_CHANGED: 'whatsapp.connection.changed',
  WHATSAPP_QR_RECEIVED: 'whatsapp.qr.received'
};

module.exports = {
  eventBus,
  EVENTS
};
