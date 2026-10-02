/**
 * Textile Order Parser & WhatsApp Reply Generator
 * 
 * Handles multi-section WhatsApp Order Confirmations, Job Work contracts,
 * and Sizing/Weaving booking slips (e.g. KESARI NANDAN TEX FAB format).
 */

const { calculateOrderMetrics, extractDenier } = require('./orderCalculations');

/**
 * Checks if incoming text looks like a formal Textile Order Confirmation
 */
function isOrderConfirmationMessage(text) {
  if (!text || typeof text !== 'string') return false;

  const upper = text.toUpperCase();
  const hasOrderIndicator = (
    upper.includes('ORDER DETAILS') ||
    upper.includes('SO-') ||
    upper.includes('BILLING') ||
    upper.includes('BEAM DETAILS') ||
    (upper.includes('ITEM') && upper.includes('ENDS') && upper.includes('RATE'))
  );

  return hasOrderIndicator;
}

/**
 * Parses raw WhatsApp order text into structured fields
 */
function parseOrderMessage(text) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;

  const clean = (str) => (str || '').replace(/[*_~`]/g, '').trim();

  const data = {
    mill_name: '',
    order_no: '',
    order_date: '',
    customer_name: '',
    party_name: '',
    billing_address: '',
    gst_no: '',
    item_name: '',
    ends: 0,
    panna: 0,
    denier: 21,
    rate: 0,
    rate_note: '++',
    rate_type: 'PER_KG',
    cartage_rate: 0,
    out_beam_rate: 0,
    beam_count: 0,
    meter_per_beam: 0,
    total_meters: 0,
    terms: '',
    delivery: '',
    notes: '',
    raw_message: text
  };

  let currentSection = '';
  const billingAddressLines = [];
  const termsLines = [];
  const notesLines = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const stripped = clean(rawLine);
    const upperStripped = stripped.toUpperCase();

    // 1. Identify Header / Mill Name (Skip religious invocation like શ્રી ગણેશાય નમઃ or Om)
    if (!data.mill_name && i < 4) {
      if (
        !upperStripped.includes('ગણેશાય') &&
        !upperStripped.includes('GANESH') &&
        !upperStripped.includes('ORDER') &&
        !upperStripped.includes('DATE') &&
        stripped.length > 3
      ) {
        data.mill_name = stripped;
        continue;
      }
    }

    // 2. Section Headers
    if (upperStripped === 'ORDER DETAILS' || upperStripped === 'ORDER DETAIL') {
      currentSection = 'ORDER';
      continue;
    }
    if (upperStripped === 'BILLING' || upperStripped === 'BILLING DETAILS' || upperStripped === 'BUYER') {
      currentSection = 'BILLING';
      continue;
    }
    if (upperStripped === 'ITEM DETAILS' || upperStripped === 'ITEM' || upperStripped === 'FABRIC DETAILS') {
      currentSection = 'ITEM';
      continue;
    }
    if (upperStripped === 'PRICING' || upperStripped === 'PRICE DETAILS' || upperStripped === 'RATE DETAILS') {
      currentSection = 'PRICING';
      continue;
    }
    if (upperStripped === 'BEAM DETAILS' || upperStripped === 'BEAMS' || upperStripped === 'BEAM') {
      currentSection = 'BEAM';
      continue;
    }
    if (upperStripped === 'TERMS' || upperStripped === 'PAYMENT TERMS' || upperStripped === 'TERMS & CONDITIONS') {
      currentSection = 'TERMS';
      continue;
    }
    if (upperStripped === 'DELIVERY' || upperStripped === 'DISPATCH') {
      currentSection = 'DELIVERY';
      continue;
    }
    if (upperStripped === 'IMPORTANT' || upperStripped === 'NOTE' || upperStripped === 'REMARKS') {
      currentSection = 'IMPORTANT';
      continue;
    }

    // 3. Process Section Contents or Key-Value Pairs
    const colonIndex = stripped.indexOf(':');
    let key = '';
    let val = '';

    if (colonIndex !== -1) {
      key = stripped.slice(0, colonIndex).trim().toUpperCase();
      val = stripped.slice(colonIndex + 1).trim();
    }

    // Specific key-value matchers
    if (key.includes('DATE')) {
      data.order_date = val;
    } else if (key === 'ORDER' || key.includes('ORDER NO') || key.includes('SO NO') || key.includes('PO NO')) {
      data.order_no = val;
    } else if (key === 'CUSTOMER' || key === 'CUSTOMER NAME' || key === 'CLIENT') {
      data.customer_name = val;
    } else if (key === 'PARTY' || key === 'PARTY NAME' || key === 'BUYER') {
      data.party_name = val;
    } else if (key === 'ADDRESS' || key === 'BILLING ADDRESS') {
      billingAddressLines.push(val);
    } else if (key === 'GST NO' || key.includes('GSTIN') || key.includes('GST')) {
      data.gst_no = val === '-' ? '' : val;
    } else if (key === 'ITEM' || key === 'YARN' || key === 'QUALITY') {
      data.item_name = val;
    } else if (key === 'ENDS' || key === 'TAR') {
      data.ends = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
    } else if (key === 'PANNA' || key.includes('WIDTH')) {
      data.panna = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    } else if (key === 'RATE' || key.includes('PRICE')) {
      const rateNum = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
      data.rate = rateNum;
      if (val.includes('++') || val.includes('+')) {
        data.rate_note = '++';
      }
    } else if (key === 'CARTAGE') {
      // Cartage : ₹800 / Beam
      data.cartage_rate = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    } else if (key === 'NOTE' || key === 'OUT BEAM') {
      // e.g. NOTE : RS.400 WILL BE CHARGED ON EVERY OUT BEAM
      const matchOut = val.match(/(?:RS\.?|₹|INR)\s*(\d+)/i) || val.match(/(\d+)\s*(?:WILL BE CHARGED|ON EVERY OUT BEAM)/i);
      if (matchOut) {
        data.out_beam_rate = parseFloat(matchOut[1]) || 0;
      }
    } else if (key.includes('TOTAL BEAM') || key === 'BEAMS' || key === 'BEAM') {
      data.beam_count = parseInt(val.replace(/[^0-9]/g, ''), 10) || data.beam_count;
    } else if (key.includes('TOTAL MTR') || key.includes('TOTAL METER') || key === 'METER') {
      data.total_meters = parseFloat(val.replace(/[^0-9.]/g, '')) || data.total_meters;
    } else if (key.includes('DELIVERY')) {
      data.delivery = val;
    } else {
      // Section-specific fallback parsing (no colon)
      if (currentSection === 'BILLING') {
        const u = stripped.toUpperCase();
        if (u.startsWith('CUSTOMER:') || u.startsWith('CUSTOMER :')) {
          data.customer_name = stripped.replace(/^CUSTOMER\s*:\s*/i, '').trim();
        } else if (u.startsWith('PARTY:') || u.startsWith('PARTY :')) {
          data.party_name = stripped.replace(/^PARTY\s*:\s*/i, '').trim();
        } else if (u.startsWith('ADDRESS:') || u.startsWith('ADDRESS :')) {
          billingAddressLines.push(stripped.replace(/^ADDRESS\s*:\s*/i, '').trim());
        } else if (u.startsWith('GST NO:') || u.startsWith('GST:')) {
          data.gst_no = stripped.replace(/^GST(?:\s*NO)?\s*:\s*/i, '').trim();
        } else if (!data.party_name) {
          data.party_name = stripped;
        } else {
          billingAddressLines.push(stripped);
        }
      } else if (currentSection === 'BEAM') {
        // Line like "6 x 8550 METER"
        const beamMultMatch = stripped.match(/(\d+)\s*[xX*]\s*(\d+(?:\.\d+)?)\s*(?:MTR|METER|M)?/i);
        if (beamMultMatch) {
          data.beam_count = parseInt(beamMultMatch[1], 10) || data.beam_count;
          data.meter_per_beam = parseFloat(beamMultMatch[2]) || data.meter_per_beam;
        }
      } else if (currentSection === 'TERMS') {
        termsLines.push(stripped);
      } else if (currentSection === 'DELIVERY') {
        if (!data.delivery) data.delivery = stripped;
      } else if (currentSection === 'IMPORTANT') {
        notesLines.push(stripped);
      }
    }
  }

  // Combine multiline sections
  data.billing_address = billingAddressLines.join(', ');
  data.terms = data.terms || termsLines.join(' ');
  data.notes = data.notes || notesLines.join(' ');

  // Compute beam meter relationships if one is missing
  if (data.beam_count > 0 && data.total_meters > 0 && !data.meter_per_beam) {
    data.meter_per_beam = data.total_meters / data.beam_count;
  }
  if (data.beam_count > 0 && data.meter_per_beam > 0 && !data.total_meters) {
    data.total_meters = data.beam_count * data.meter_per_beam;
  }

  // Denier extraction
  data.denier = extractDenier(data.item_name);

  // Default order_date to today if not parsed
  if (!data.order_date) {
    const now = new Date();
    data.order_date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }

  // Calculate technical & financial metrics
  const calculations = calculateOrderMetrics(data);

  return {
    ...data,
    calculations
  };
}

/**
 * Formats WhatsApp reply message matching the exact Surat textile order format
 */
function formatOrderReplyMessage(order) {
  const millName = order.mill_name || 'KESARI NANDAN TEX FAB';
  const orderDate = order.order_date || '28/09/2026';
  const orderNo = order.order_no || 'SO-000274';
  const customerName = order.customer_name || order.sender_name || 'Asmita miyani';
  const partyName = order.party_name || 'YOGI TEX FAB';
  const rawAddress = order.billing_address || 'Plot No. 12-13, Jalbhumi Industrial, Olpad Sayan Road, Surat, Gujarat - 394130';
  const billingAddress = rawAddress.replace(/^ADDRESS\s*:\s*/i, '').trim();
  const rawGst = order.gst_no || '-';
  const gstNo = rawGst.replace(/^GST(?:\s*NO)?\s*:\s*/i, '').trim() || '-';
  const itemName = order.item_name || '21/1 NYLON BRIGHT MONO';
  const ends = order.ends || 11808;
  const panna = order.panna ? `${order.panna}"` : '54"';
  
  const rate = order.rate !== undefined && order.rate !== null ? order.rate : 300;
  const rateNote = order.rate_note || '++';
  const cartageRate = order.cartage_rate !== undefined && order.cartage_rate !== null ? order.cartage_rate : 800;
  const outBeamRate = order.out_beam_rate !== undefined && order.out_beam_rate !== null ? order.out_beam_rate : 400;
  
  const beamCount = order.beam_count || 6;
  const meterPerBeam = order.meter_per_beam || 8550;
  const totalMeters = order.total_meters || (beamCount * meterPerBeam) || 51300;
  
  const terms = order.terms || '15 DAYS NET BILL TO BILL\n(1.5% interest after due date)';
  const delivery = order.delivery || 'Delivery after 7 Days';
  const notes = order.notes || '[NO FABRICS CLAIM]\n[No Dyeing Guarantee]';

  return `શ્રી ગણેશાય નમઃ
*${millName}*

*ORDER DETAILS*
DATE  : ${orderDate}
ORDER : ${orderNo}

*BILLING*
CUSTOMER : ${customerName}
PARTY    : ${partyName}
ADDRESS  : ${billingAddress}
GST NO   : ${gstNo}

*ITEM DETAILS*
ITEM  : ${itemName}
ENDS  : ${ends}
PANNA : ${panna}

*PRICING*
*RATE    : ${rate}${rateNote}*
CARTAGE : ₹${cartageRate} / Beam
*NOTE    : RS.${outBeamRate} WILL BE CHARGED ON EVERY OUT BEAM*

*BEAM DETAILS*
${beamCount}   x  ${meterPerBeam} METER
TOTAL BEAM : ${beamCount}
*TOTAL MTR  : ${totalMeters} METER*

*TERMS*
${terms}

*DELIVERY*
${delivery}

*IMPORTANT*
${notes}`;
}

module.exports = {
  isOrderConfirmationMessage,
  parseOrderMessage,
  formatOrderReplyMessage
};
