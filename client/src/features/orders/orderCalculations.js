/**
 * Frontend Textile Warp Yarn & Order Calculations
 * Reactive calculations for instant UI feedback
 */

export function extractDenier(itemName) {
  if (!itemName || typeof itemName !== 'string') return 21;
  
  const slashMatch = itemName.match(/\b(\d+(?:\.\d+)?)\s*\/\s*\d+/);
  if (slashMatch) return parseFloat(slashMatch[1]);

  const dMatch = itemName.match(/\b(\d+(?:\.\d+)?)\s*(?:d|denier)\b/i);
  if (dMatch) return parseFloat(dMatch[1]);

  const numMatch = itemName.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numMatch) return parseFloat(numMatch[1]);

  return 21;
}

export function calculateOrderMetrics(input = {}) {
  const ends = Math.max(0, parseInt(input.ends, 10) || 0);
  const beamCount = Math.max(0, parseInt(input.beam_count || input.beamCount || 1, 10));
  const meterPerBeam = Math.max(0, parseFloat(input.meter_per_beam || input.meterPerBeam || 0));
  
  let totalMeters = Math.max(0, parseFloat(input.total_meters || input.totalMeters || 0));
  if (totalMeters === 0 && beamCount > 0 && meterPerBeam > 0) {
    totalMeters = beamCount * meterPerBeam;
  }
  const effectiveMeterPerBeam = meterPerBeam > 0 ? meterPerBeam : (beamCount > 0 ? totalMeters / beamCount : 0);

  const panna = parseFloat(input.panna || 0) || 0;
  const denier = parseFloat(input.denier) > 0 ? parseFloat(input.denier) : extractDenier(input.item_name || input.itemName || '');

  // Denier Formula: (Ends * Length (m) * Denier) / 9,000,000
  const weightPerBeamKg = (ends > 0 && effectiveMeterPerBeam > 0 && denier > 0)
    ? (ends * effectiveMeterPerBeam * denier) / 9000000
    : 0;

  const totalWeightKg = (ends > 0 && totalMeters > 0 && denier > 0)
    ? (ends * totalMeters * denier) / 9000000
    : (weightPerBeamKg * beamCount);

  const rate = Math.max(0, parseFloat(input.rate || 0));
  const rateType = (input.rate_type || input.rateType || 'PER_KG').toUpperCase();
  const rateNote = input.rate_note || input.rateNote || '++';

  const basicAmount = rateType === 'PER_METER' 
    ? totalMeters * rate 
    : totalWeightKg * rate;

  const cartageRate = Math.max(0, parseFloat(input.cartage_rate || input.cartageRate || 0));
  const cartageTotal = beamCount * cartageRate;

  const outBeamRate = Math.max(0, parseFloat(input.out_beam_rate || input.outBeamRate || 0));
  const outBeamTotal = beamCount * outBeamRate;

  const subtotal = basicAmount + cartageTotal + outBeamTotal;

  const gstPercent = Math.max(0, parseFloat(input.gst_percent || input.gstPercent || 0));
  const gstAmount = (subtotal * gstPercent) / 100;
  const grandTotal = subtotal + gstAmount;

  return {
    ends,
    panna,
    denier: Number(denier.toFixed(2)),
    beamCount,
    meterPerBeam: Number(effectiveMeterPerBeam.toFixed(2)),
    totalMeters: Number(totalMeters.toFixed(2)),
    weightPerBeamKg: Number(weightPerBeamKg.toFixed(2)),
    totalWeightKg: Number(totalWeightKg.toFixed(2)),
    rate: Number(rate.toFixed(2)),
    rateType,
    rateNote,
    basicAmount: Number(basicAmount.toFixed(2)),
    cartageRate: Number(cartageRate.toFixed(2)),
    cartageTotal: Number(cartageTotal.toFixed(2)),
    outBeamRate: Number(outBeamRate.toFixed(2)),
    outBeamTotal: Number(outBeamTotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    gstPercent: Number(gstPercent.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2))
  };
}

export function formatOrderReply(order) {
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
