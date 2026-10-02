/**
 * Textile Warp Yarn & Order Calculations
 * 
 * Provides standard formulas for textile manufacturing:
 * - Denier-based filament warp weight calculations
 * - Cartage & Out beam handling charges
 * - Rate computations (Per Kg or Per Meter)
 * - GST and Grand Total estimations
 */

/**
 * Extracts Denier from yarn name like "21/1 NYLON BRIGHT MONO" -> 21
 */
function extractDenier(itemName) {
  if (!itemName || typeof itemName !== 'string') return 21;
  
  // Matches "21/1", "21/2", "30D", "21 Denier", "21 D"
  const slashMatch = itemName.match(/\b(\d+(?:\.\d+)?)\s*\/\s*\d+/);
  if (slashMatch) {
    return parseFloat(slashMatch[1]);
  }

  const dMatch = itemName.match(/\b(\d+(?:\.\d+)?)\s*(?:d|denier)\b/i);
  if (dMatch) {
    return parseFloat(dMatch[1]);
  }

  const numMatch = itemName.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }

  return 21; // Sensible default for nylon mono
}

/**
 * Calculate all technical and financial metrics for an order
 */
function calculateOrderMetrics(input = {}) {
  const ends = Math.max(0, parseInt(input.ends, 10) || 0);
  const beamCount = Math.max(0, parseInt(input.beam_count || input.beamCount || input.total_beam || input.totalBeam, 10) || 1);
  const meterPerBeam = Math.max(0, parseFloat(input.meter_per_beam || input.meterPerBeam || input.meter || 0));
  
  // Total meters: prioritize explicit total_meters, else beamCount * meterPerBeam
  let totalMeters = Math.max(0, parseFloat(input.total_meters || input.totalMeters || 0));
  if (totalMeters === 0 && beamCount > 0 && meterPerBeam > 0) {
    totalMeters = beamCount * meterPerBeam;
  }
  const effectiveMeterPerBeam = meterPerBeam > 0 ? meterPerBeam : (beamCount > 0 ? totalMeters / beamCount : 0);

  const panna = parseFloat(input.panna || 0) || 0;
  const denier = parseFloat(input.denier) > 0 ? parseFloat(input.denier) : extractDenier(input.item_name || input.itemName || input.yarn || '');

  // 1. Warp Weight Calculations
  // Standard Denier Formula: Weight (kg) = (Ends * Length (m) * Denier) / 9,000,000
  const weightPerBeamKg = (ends > 0 && effectiveMeterPerBeam > 0 && denier > 0)
    ? (ends * effectiveMeterPerBeam * denier) / 9000000
    : 0;

  const totalWeightKg = (ends > 0 && totalMeters > 0 && denier > 0)
    ? (ends * totalMeters * denier) / 9000000
    : (weightPerBeamKg * beamCount);

  // 2. Financial Calculations
  const rate = Math.max(0, parseFloat(input.rate || 0));
  const rateType = (input.rate_type || input.rateType || 'PER_KG').toUpperCase(); // 'PER_KG' or 'PER_METER'
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

module.exports = {
  extractDenier,
  calculateOrderMetrics
};
