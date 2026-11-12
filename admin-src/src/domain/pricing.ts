import type { ID, ISODate, Property, Rate, Season } from '@/types';
import { eachDay, isWeekendNight, nightsBetween } from '@/lib/dates';

export interface NightPrice {
  date: ISODate;
  price: number;
  minStay: number;
  /** De dónde sale el precio de esa noche. */
  source: 'override' | 'season' | 'weekend' | 'base';
  season?: Season;
}

export const rateKey = (propertyId: ID, date: ISODate): string => `${propertyId}|${date}`;
export const indexRates = (rates: Rate[]): Map<string, Rate> => new Map(rates.map((r) => [rateKey(r.propertyId, r.date), r]));

/**
 * Precio de una noche. Orden de prioridad:
 * 1. Tarifa cargada para esa fecha.
 * 2. Precio base (o de fin de semana, viernes y sábado) ajustado por la temporada vigente.
 */
export function priceForNight(property: Property, date: ISODate, rates: Map<string, Rate>, seasons: Season[]): NightPrice {
  const override = rates.get(rateKey(property.id, date));
  const minStay = override?.minStay ?? property.minStay;
  if (override?.price != null) return { date, price: override.price, minStay, source: 'override' };
  const weekend = isWeekendNight(date) && property.weekendPrice != null;
  const base = weekend ? property.weekendPrice! : property.basePrice;
  const season = seasons.find((s) => date >= s.start && date < s.end);
  if (season) return { date, price: Math.round(base * (1 + season.adjustPct / 100)), minStay, source: 'season', season };
  return { date, price: base, minStay, source: weekend ? 'weekend' : 'base' };
}

export interface Quote {
  nights: number;
  accommodation: number;
  cleaning: number;
  discount: number;
  discountLabel: string | null;
  minStay: number;
}

/** Cotización sugerida para una estadía, según tarifas, temporadas y descuentos por estadía larga. */
export function quoteStay(property: Property, checkIn: ISODate, checkOut: ISODate, rates: Map<string, Rate>, seasons: Season[]): Quote {
  const n = nightsBetween(checkIn, checkOut);
  const perNight = eachDay(checkIn, checkOut).map((d) => priceForNight(property, d, rates, seasons));
  const accommodation = perNight.reduce((s, p) => s + p.price, 0);
  let pct = 0;
  let label: string | null = null;
  if (n >= 28 && property.monthlyDiscount > 0) { pct = property.monthlyDiscount; label = `Descuento mensual ${pct} %`; }
  else if (n >= 7 && property.weeklyDiscount > 0) { pct = property.weeklyDiscount; label = `Descuento semanal ${pct} %`; }
  return {
    nights: n,
    accommodation,
    cleaning: property.cleaningFee,
    discount: Math.round((accommodation * pct) / 100),
    discountLabel: label,
    minStay: perNight[0]?.minStay ?? property.minStay,
  };
}
