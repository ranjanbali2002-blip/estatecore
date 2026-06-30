/** Formats a number as Indian rupees: ₹1,23,456 */
export function formatINR(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Compact INR for charts/cards: ₹1.2 Cr, ₹45 L, ₹9,000 */
export function formatINRCompact(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return formatINR(n);
}

export default formatINR;
