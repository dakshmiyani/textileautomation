/**
 * Message Parser Integration
 * 
 * Extracts plain text from Baileys message objects,
 * normalizes textile production keys, and parses key-value pairs flexibly.
 */

function extractTextMessage(m) {
  if (!m || !m.message) return null;
  const msg = m.message;

  if (typeof msg.conversation === 'string' && msg.conversation.trim().length > 0) {
    return msg.conversation.trim();
  }

  if (msg.extendedTextMessage && typeof msg.extendedTextMessage.text === 'string' && msg.extendedTextMessage.text.trim().length > 0) {
    return msg.extendedTextMessage.text.trim();
  }

  return null;
}

function normalizeKey(rawKey) {
  if (!rawKey) return '';
  const cleaned = rawKey.trim().toLowerCase().replace(/\s+/g, ' ');

  if (/^yarn$/i.test(cleaned)) return 'yarn';
  if (/^ends?$/i.test(cleaned)) return 'ends';
  if (/^meters?$/i.test(cleaned)) return 'meter';

  if (
    /^panna(\s*\(\s*beam\s*width\s*\))?$/i.test(cleaned) ||
    /^panna\s*beam\s*width$/i.test(cleaned) ||
    /^beam\s*width$/i.test(cleaned)
  ) {
    return 'panna';
  }

  if (/^total\s*beams?$/i.test(cleaned)) return 'totalBeam';
  if (/^(customer(\s*name)?|client)$/i.test(cleaned)) return 'customer';
  if (/^(party(\s*name)?|buyer)$/i.test(cleaned)) return 'party';
  if (/^(address|billing\s*address)$/i.test(cleaned)) return 'address';
  if (/^(gst|gst\s*no|gstin)$/i.test(cleaned)) return 'gst';

  return cleaned;
}

function parseKeyValueText(text) {
  if (!text || typeof text !== 'string') {
    return { rawFields: {}, validLineCount: 0 };
  }

  const lines = text.split(/\r?\n/);
  const rawFields = {};
  let validLineCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      const rawKey = trimmed.slice(0, colonIndex).trim();
      const rawVal = trimmed.slice(colonIndex + 1).trim();

      const normalizedKey = normalizeKey(rawKey);
      if (normalizedKey) {
        rawFields[normalizedKey] = rawVal;
        validLineCount++;
      }
    }
  }

  return { rawFields, validLineCount };
}

const FORMAT_REGISTRY = {
  YARN_PRODUCTION: {
    id: 'YARN_PRODUCTION',
    name: 'Yarn Production',
    requiredKeys: ['yarn', 'ends', 'meter', 'panna', 'totalBeam'],
    isMatch: (rawFields) => {
      // Must contain at least 2 of the critical yarn production fields to be considered production
      const matchingKeys = ['yarn', 'ends', 'meter', 'panna', 'totalBeam'].filter(
        (k) => Object.prototype.hasOwnProperty.call(rawFields, k)
      );
      return matchingKeys.length >= 2;
    }
  }
};

/**
 * Parses incoming message. If not recognized as a production format, returns null.
 */
function parseProductionMessage(text) {
  const { rawFields, validLineCount } = parseKeyValueText(text);

  let detectedFormat = null;
  for (const format of Object.values(FORMAT_REGISTRY)) {
    if (format.isMatch(rawFields)) {
      detectedFormat = format.id;
      break;
    }
  }

  if (!detectedFormat) {
    return null;
  }

  return {
    formatId: detectedFormat,
    fields: rawFields,
    yarn: rawFields.yarn,
    ends: rawFields.ends,
    meter: rawFields.meter,
    panna: rawFields.panna,
    totalBeam: rawFields.totalBeam,
    customer: rawFields.customer,
    party: rawFields.party,
    address: rawFields.address,
    gst: rawFields.gst,
    validLineCount
  };
}

function formatWhatsAppNumber(jid) {
  if (!jid) return 'Unknown';
  const phonePart = jid.split('@')[0].split(':')[0];
  const digitsOnly = phonePart.replace(/[^0-9]/g, '');
  if (!digitsOnly) return jid;
  return `+${digitsOnly}`;
}

module.exports = {
  extractTextMessage,
  normalizeKey,
  parseKeyValueText,
  parseProductionMessage,
  formatWhatsAppNumber,
  FORMAT_REGISTRY
};
