/**
 * Duplicate Detector Integration
 * 
 * Prevents re-processing identical messages:
 * 1. Tracks Baileys unique message IDs (msg.key.id)
 * 2. Tracks sender + content fingerprint within a configurable grace window
 */
const env = require('../../config/env');

class DuplicateDetector {
  constructor(options = {}) {
    this.timeWindowMs = options.timeWindowMs || (env.DUPLICATE_WINDOW_SECONDS * 1000) || 180000;
    this.maxCacheSize = options.maxCacheSize || 3000;

    this.processedMessageIds = new Map();
    this.contentFingerprints = new Map();

    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  _generateFingerprint(sender, text) {
    const normalizedText = (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return `${sender}:::${normalizedText}`;
  }

  /**
   * Check if a message is duplicate. If not duplicate and autoRecord is true,
   * it records the message in the tracking cache.
   * 
   * Returns boolean (true if duplicate, false if new)
   */
  isDuplicate(messageId, sender, text, autoRecord = true) {
    const now = Date.now();

    if (messageId && this.processedMessageIds.has(messageId)) {
      return true;
    }

    if (sender && text) {
      const fingerprint = this._generateFingerprint(sender, text);
      const lastSeen = this.contentFingerprints.get(fingerprint);

      if (lastSeen && (now - lastSeen) < this.timeWindowMs) {
        return true;
      }
    }

    if (autoRecord) {
      this.record(messageId, sender, text);
    }

    return false;
  }

  record(messageId, sender, text) {
    const now = Date.now();

    if (messageId) {
      this.processedMessageIds.set(messageId, now);
      if (this.processedMessageIds.size > this.maxCacheSize) {
        const oldestKey = this.processedMessageIds.keys().next().value;
        this.processedMessageIds.delete(oldestKey);
      }
    }

    if (sender && text) {
      const fingerprint = this._generateFingerprint(sender, text);
      this.contentFingerprints.set(fingerprint, now);
    }
  }

  cleanup() {
    const now = Date.now();
    const expiryThreshold = now - (this.timeWindowMs * 2);

    for (const [key, timestamp] of this.contentFingerprints.entries()) {
      if (timestamp < expiryThreshold) {
        this.contentFingerprints.delete(key);
      }
    }

    const idExpiry = now - (24 * 60 * 60 * 1000);
    for (const [id, timestamp] of this.processedMessageIds.entries()) {
      if (timestamp < idExpiry) {
        this.processedMessageIds.delete(id);
      }
    }
  }

  clear() {
    this.processedMessageIds.clear();
    this.contentFingerprints.clear();
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const defaultDetector = new DuplicateDetector();

module.exports = {
  DuplicateDetector,
  duplicateDetector: defaultDetector,
  defaultDetector
};
