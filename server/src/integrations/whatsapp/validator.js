/**
 * Message Validator Integration
 * 
 * Validates parsed fields for textile production:
 * - Yarn: required non-empty string
 * - Ends: required positive number
 * - Meter: required positive number
 * - Panna: required positive number
 * - Total beam: required positive number
 */

const { extractDenier } = require('./orderCalculations');
const { formatOrderReplyMessage } = require('../whatsapp/orderParser');


function parsePositiveNumber(val) {
  if (val === undefined || val === null) {
    return { isValid: false, numValue: null };
  }

  const str = String(val).trim().replace(/,/g, '');
  if (!str) {
    return { isValid: false, numValue: null };
  }

  // Extract the first sequence of digits (ignoring leading non-digit characters if any)
  const match = str.match(/^[\D]*(\d+(\.\d+)?)/);
  if (!match) {
    return { isValid: false, numValue: null };
  }

  const num = Number(match[1]);
  if (!Number.isFinite(num) || num <= 0) {
    return { isValid: false, numValue: null };
  }

  return { isValid: true, numValue: num };
}

function validateYarnProduction(fields, context = {}) {
  const errors = [];
  const cleanData = {};

  if (!fields.yarn || typeof fields.yarn !== 'string' || fields.yarn.trim().length === 0) {
    errors.push('Missing or invalid "Yarn" text value');
  } else {
    cleanData.yarn = fields.yarn.trim();
  }

  const endsCheck = parsePositiveNumber(fields.ends);
  if (!endsCheck.isValid) {
    errors.push('Missing or invalid "Ends" (must be a positive number)');
  } else {
    cleanData.ends = endsCheck.numValue;
  }

  const meterCheck = parsePositiveNumber(fields.meter);
  if (!meterCheck.isValid) {
    errors.push('Missing or invalid "Meter" (must be a positive number)');
  } else {
    cleanData.meter = meterCheck.numValue;
  }

  const pannaCheck = parsePositiveNumber(fields.panna);
  if (!pannaCheck.isValid) {
    errors.push('Missing or invalid "Panna(beam width)" (must be a positive number)');
  } else {
    cleanData.panna = pannaCheck.numValue;
  }

  const totalBeamCheck = parsePositiveNumber(fields.totalBeam);
  if (!totalBeamCheck.isValid) {
    errors.push('Missing or invalid "Total beam" (must be a positive number)');
  } else {
    cleanData.totalBeam = totalBeamCheck.numValue;
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      data: null,
      errors,
      replyMessage: null
    };
  }

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const rawFields = context.rawFields || {};
  const profile = context.customerProfile || {};

  const customerName = rawFields.customer || rawFields.customer_name || profile.customer_name || context.senderName || 'Asmita miyani';
  const partyName = rawFields.party || rawFields.party_name || profile.party_name || 'YOGI TEX FAB';
  const billingAddress = rawFields.address || rawFields.billing_address || profile.billing_address || 'Plot No. 12-13, Jalbhumi Industrial, Olpad Sayan Road, Surat, Gujarat - 394130';
  const gstNo = rawFields.gst || rawFields.gst_no || profile.gst_no || '-';

  const order = {
    mill_name: 'KESARI NANDAN TEX FAB',
    order_date: dateStr,
    order_no: `SO-${String(Date.now()).slice(-6)}`,
    customer_name: customerName,
    party_name: partyName,
    billing_address: billingAddress,
    gst_no: gstNo,
    item_name: cleanData.yarn,
    ends: cleanData.ends,
    panna: cleanData.panna,
    rate: 300,
    rate_note: '++',
    cartage_rate: 800,
    out_beam_rate: 400,
    beam_count: cleanData.totalBeam,
    meter_per_beam: cleanData.meter,
    total_meters: cleanData.totalBeam * cleanData.meter,
    terms: '15 DAYS NET BILL TO BILL\n(1.5% interest after due date)',
    delivery: 'Delivery after 7 Days',
    notes: '[NO FABRICS CLAIM]\n[No Dyeing Guarantee]'
  };

  return {
    isValid: true,
    data: cleanData,
    customerData: {
      customer_name: customerName,
      party_name: partyName,
      billing_address: billingAddress,
      gst_no: gstNo
    },
    errors: [],
    replyMessage: formatOrderReplyMessage(order)
  };
}

function validateProductionData(parsedResult, context = {}) {
  if (!parsedResult) {
    return {
      isValid: false,
      data: null,
      errors: ['No data fields found in message'],
      replyMessage: null
    };
  }

  const fields = parsedResult.fields || parsedResult;
  return validateYarnProduction(fields, context);
}

module.exports = {
  validateYarnProduction,
  validateProductionData,
  parsePositiveNumber
};
