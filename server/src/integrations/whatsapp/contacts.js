/**
 * Contact Store Integration
 * 
 * Manages phone-saved contact names, pushNames, and contacts.json persistence
 */
const fs = require('fs');
const path = require('path');
const env = require('../../config/env');
const logger = require('../../config/logger');

const DEFAULT_CONTACTS_FILE = path.join(env.STORAGE_DIR, 'contacts.json');

class ContactStore {
  constructor(filePath = DEFAULT_CONTACTS_FILE) {
    this.filePath = filePath;
    this.contacts = new Map();
    this.loadFromFile();
  }

  _normalizeKey(str) {
    if (!str) return '';
    return str
      .split('@')[0]
      .split(':')[0]
      .replace(/[^0-9a-zA-Z]/g, '')
      .toLowerCase();
  }

  loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const c of parsed) {
            this._storeContactInMemory(c);
          }
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, '[CONTACTS] Failed to load contacts.json');
    }
  }

  saveToFile() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const unique = Array.from(new Set(this.contacts.values()));
      fs.writeFileSync(this.filePath, JSON.stringify(unique, null, 2), 'utf8');
    } catch (err) {
      logger.warn({ err: err.message }, '[CONTACTS] Failed to save contacts.json');
    }
  }

  _storeContactInMemory(contact) {
    if (!contact) return;

    const keys = [];
    if (contact.id) {
      keys.push(contact.id);
      keys.push(this._normalizeKey(contact.id));
    }
    if (contact.phoneNumber) {
      keys.push(contact.phoneNumber);
      keys.push(this._normalizeKey(contact.phoneNumber));
    }
    if (contact.lid) {
      keys.push(contact.lid);
      keys.push(this._normalizeKey(contact.lid));
    }

    for (const k of keys) {
      if (k) {
        const existing = this.contacts.get(k) || {};
        const merged = {
          ...existing,
          ...contact,
          name: contact.name || existing.name || undefined,
          notify: contact.notify || existing.notify || undefined,
          verifiedName: contact.verifiedName || existing.verifiedName || undefined
        };
        this.contacts.set(k, merged);
      }
    }
  }

  upsertContacts(contactsList) {
    if (!Array.isArray(contactsList) || contactsList.length === 0) return;
    for (const c of contactsList) {
      this._storeContactInMemory(c);
    }
    this.saveToFile();
  }

  updateContacts(updatesList) {
    if (!Array.isArray(updatesList) || updatesList.length === 0) return;
    for (const c of updatesList) {
      this._storeContactInMemory(c);
    }
    this.saveToFile();
  }

  getSenderName({ senderJid, formattedPhone, pushName, lid }) {
    const lookupKeys = [
      senderJid,
      this._normalizeKey(senderJid),
      formattedPhone,
      this._normalizeKey(formattedPhone),
      lid,
      this._normalizeKey(lid)
    ].filter(Boolean);

    // 1. Phone saved name
    for (const key of lookupKeys) {
      const contact = this.contacts.get(key);
      if (contact && contact.name && typeof contact.name === 'string' && contact.name.trim().length > 0) {
        return contact.name.trim();
      }
    }

    // 2. PushName
    if (pushName && typeof pushName === 'string' && pushName.trim().length > 0) {
      return pushName.trim();
    }

    // 3. Notify / verified name
    for (const key of lookupKeys) {
      const contact = this.contacts.get(key);
      if (contact && contact.notify && typeof contact.notify === 'string' && contact.notify.trim().length > 0) {
        return contact.notify.trim();
      }
      if (contact && contact.verifiedName && typeof contact.verifiedName === 'string' && contact.verifiedName.trim().length > 0) {
        return contact.verifiedName.trim();
      }
    }

    return formattedPhone || 'Unknown';
  }
}

const defaultContactStore = new ContactStore();

module.exports = {
  ContactStore,
  defaultContactStore
};
