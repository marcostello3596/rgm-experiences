import type { Currency, Settings } from '@/types';
import { money } from '@/lib/format';

/**
 * Regla: nunca se suman monedas distintas sin una conversión explícita.
 * - Si `convert` está apagado, los importes en otra moneda quedan FUERA del total.
 * - Si está prendido, se convierten con el tipo de cambio ficticio de Configuración → Moneda.
 */
export interface MoneyView {
  currency: Currency;
  convert: boolean;
  demoRate: number;
}

export const viewFromSettings = (s: Settings, override?: Currency): MoneyView => ({ currency: override ?? s.currency.reporting, convert: s.currency.convert, demoRate: s.currency.demoRate });

/** Devuelve el importe expresado en la moneda de la vista, o null si no corresponde incluirlo. */
export function toView(amount: number, currency: Currency, view: MoneyView): number | null {
  if (currency === view.currency) return amount;
  if (!view.convert || view.demoRate <= 0) return null;
  return currency === 'USD' ? amount * view.demoRate : amount / view.demoRate;
}

export const fmtView = (amount: number, view: MoneyView): string => money(amount, view.currency);

/** Texto corto que acompaña a cada indicador para aclarar qué se sumó. */
export const viewCaption = (view: MoneyView): string => {
  const other: Currency = view.currency === 'USD' ? 'ARS' : 'USD';
  return view.convert
    ? `${view.currency} · ${other} convertido a tipo de cambio ficticio (1 USD = ${view.demoRate.toLocaleString('es-AR')} ARS)`
    : `Sólo importes en ${view.currency} · los de ${other} no se suman`;
};
