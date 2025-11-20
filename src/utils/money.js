// Monetary utilities centralizing rounding & tax splitting
// All numbers are treated as Number internally (avoid string toFixed cascades)

export const round2 = (n) => Number((Number(n) || 0).toFixed(2));

export function splitTax(gross, rate) {
  const g = Number(gross) || 0;
  const r = Number(rate) || 0;
  if (!g) return { base: 0, tax: 0 };
  if (!r) return { base: g, tax: 0 };
  const base = g / (1 + r);
  const tax = g - base;
  return { base: round2(base), tax: round2(tax) };
}

export function lineTotal(unitPrice, qty) {
  return round2(Number(unitPrice) * Number(qty || 0));
}

export function sumLines(lines, selector) {
  return round2(lines.reduce((acc, l) => acc + Number(selector(l) || 0), 0));
}