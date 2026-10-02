/**
 * Format numbers with comma separators
 */
export function formatNumber(val, decimals = 0) {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Number(val);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format meters with unit
 */
export function formatMeters(meters) {
  return `${formatNumber(meters, 1)} m`;
}

/**
 * Format beams
 */
export function formatBeams(beams) {
  return `${formatNumber(beams)} beams`;
}

/**
 * Format standard date DD MMM YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
