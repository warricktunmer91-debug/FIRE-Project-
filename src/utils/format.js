/**
 * Formatting utilities for the FIRE planning app.
 */

/**
 * Format a dollar amount with appropriate suffix.
 * e.g. 297000 → "$297k", 2001446 → "$2.0M", 10000 → "$10k"
 */
export function fmtDollar(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(decimals)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${Math.round(abs / 1_000)}k`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

/** Format a percentage, e.g. 0.942 → "94.2%" */
export function fmtPct(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format a monthly dollar amount */
export function fmtMonthly(value) {
  if (!value && value !== 0) return '—';
  return `$${Math.round(value).toLocaleString()}/mo`;
}

/** Format a yearly dollar amount */
export function fmtAnnual(value) {
  if (!value && value !== 0) return '—';
  return `$${Math.round(value).toLocaleString()}/yr`;
}

/** Recharts Y-axis tick formatter */
export function yAxisFormatter(value) {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
}

/** Recharts tooltip formatter */
export function tooltipFormatter(value, name) {
  return [fmtDollar(value), name];
}

/** Recharts tooltip label formatter (age → "Age XX") */
export function tooltipLabelFormatter(age) {
  return `Age ${age}`;
}
