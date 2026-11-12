import type { Currency } from '@/types';

const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const SYMBOL: Record<Currency, string> = { USD: 'US$', ARS: '$' };

/** "US$ 1.250" / "$ 85.000". Siempre con el símbolo de la moneda para no mezclar importes. */
export const money = (amount: number, currency: Currency, decimals = false): string => {
  const sign = amount < 0 ? '−' : '';
  return `${sign}${SYMBOL[currency]} ${(decimals ? nf2 : nf0).format(Math.abs(amount))}`;
};
export const num = (n: number): string => nf0.format(n);
export const pct = (ratio: number, digits = 0): string => `${(ratio * 100).toFixed(digits).replace('.', ',')} %`;
export const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
export const initials = (name: string): string => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
export const normalize = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const matches = (haystack: string, query: string): boolean => normalize(haystack).includes(normalize(query.trim()));
