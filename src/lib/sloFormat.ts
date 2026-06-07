/** Slovenian number formatting helpers. Always use decimal comma. */
export const fmtSI = (n: number, frac = 2): string =>
  (Number.isFinite(n) ? n : 0).toLocaleString('sl-SI', {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });

export const fmtEUR = (n: number): string => `${fmtSI(n)} €`;

/** Parse SI-formatted numeric input ("2.360,77" or "2360,77" or "2360.77"). */
export const parseSI = (s: string | number): number => {
  if (typeof s === 'number') return s;
  if (!s) return 0;
  const cleaned = String(s).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

/** Set the BackOffice status-bar Funkcije hint (consumed by ShopHomePage). */
export const setFunkcije = (text: string) => {
  try { window.dispatchEvent(new CustomEvent('funkcije:set', { detail: text })); } catch { /* noop */ }
};
export const clearFunkcije = () => setFunkcije('');
