import type { CalendarBlock, ChannelId, Expense, ExpenseCategory, ID, Payment, Property, Reservation } from '@/types';
import { CHANNEL_IDS, EXPENSE_CATEGORIES } from '@/types';
import { addMonths, diffDays, endOfMonthExclusive, monthKey, nightsInRange, startOfMonth, type DateRange } from '@/lib/dates';
import { balanceOf, countsAsRevenue, isActive, netOf, nights, roomRevenueOf, totalOf } from './reservations';
import { toView, type MoneyView } from './money';

/**
 * INDICADORES — fórmulas y estados incluidos
 *
 * Estados:
 * - "Activas" = Confirmada + Pendiente + Finalizada. Ocupan el departamento.
 * - "Con ingreso" = Confirmada + Finalizada. Una reserva Pendiente todavía no cuenta como ingreso.
 * - Las Canceladas sólo cuentan en "Cancelaciones".
 *
 * Período [desde, hasta): las noches y los importes de una reserva se reparten en forma pareja entre sus noches,
 * y sólo se cuenta la parte que cae dentro del período.
 *
 * - Reservas            = reservas activas cuyo check-in cae en el período.
 * - Noches vendidas     = noches de reservas activas dentro del período.
 * - Noches disponibles  = departamentos activos × días del período − noches bloqueadas.
 * - Ocupación           = noches vendidas ÷ noches disponibles.
 * - Ingresos brutos     = total cobrado al huésped (alojamiento + limpieza − descuentos + impuestos) de reservas con ingreso.
 * - Comisiones          = comisión del canal de esas reservas (valores ficticios en la demo).
 * - Ingresos netos      = brutos − comisiones.
 * - ADR                 = ingreso por alojamiento (alojamiento − descuentos) ÷ noches de reservas con ingreso.
 * - RevPAR              = ingreso por alojamiento ÷ noches disponibles.
 * - Estadía promedio    = promedio de noches de las reservas activas con check-in en el período.
 * - Anticipación        = promedio de días entre la fecha de creación y el check-in (mismas reservas).
 * - Cancelaciones       = reservas canceladas con check-in en el período; tasa = canceladas ÷ (activas + canceladas).
 * - Pendientes de pago  = reservas Confirmadas o Pendientes con saldo mayor a cero (no depende del período).
 *
 * Monedas: cada importe se toma en la moneda elegida. Los de otra moneda se convierten con el tipo de cambio
 * ficticio sólo si la conversión está activada; si no, quedan afuera (y sus noches no entran en ADR).
 */

export interface MetricsFilter {
  range: DateRange;
  propertyId?: ID | 'all';
  channel?: ChannelId | 'all';
}

export interface MetricsSource {
  reservations: Reservation[];
  payments: Payment[];
  properties: Property[];
  blocks: CalendarBlock[];
  expenses: Expense[];
}

export interface RangeMetrics {
  bookings: number;
  nightsSold: number;
  availableNights: number;
  occupancy: number;
  gross: number;
  fees: number;
  net: number;
  roomRevenue: number;
  adr: number;
  revpar: number;
  avgStay: number;
  avgLeadDays: number;
  cancellations: number;
  cancelRate: number;
  /** Reservas cuyo importe quedó afuera por estar en otra moneda sin conversión. */
  excludedByCurrency: number;
}

const inFilter = (r: Reservation, f: MetricsFilter): boolean =>
  (!f.propertyId || f.propertyId === 'all' || r.propertyId === f.propertyId) && (!f.channel || f.channel === 'all' || r.channel === f.channel);

export function availableNights(src: MetricsSource, f: MetricsFilter): number {
  const props = src.properties.filter((p) => p.active && (!f.propertyId || f.propertyId === 'all' || p.id === f.propertyId));
  const ids = new Set(props.map((p) => p.id));
  const days = Math.max(0, diffDays(f.range.start, f.range.end));
  const blocked = src.blocks.filter((b) => ids.has(b.propertyId)).reduce((s, b) => s + nightsInRange(b.start, b.end, f.range), 0);
  return Math.max(0, props.length * days - blocked);
}

export function rangeMetrics(src: MetricsSource, f: MetricsFilter, view: MoneyView): RangeMetrics {
  const list = src.reservations.filter((r) => inFilter(r, f));
  let nightsSold = 0, gross = 0, fees = 0, roomRevenue = 0, revenueNights = 0, excluded = 0;
  let bookings = 0, stay = 0, lead = 0, cancellations = 0;

  for (const r of list) {
    const startsInRange = r.checkIn >= f.range.start && r.checkIn < f.range.end;
    if (r.status === 'cancelled') {
      if (startsInRange) cancellations++;
      continue;
    }
    if (!isActive(r)) continue;
    const total = nights(r);
    const inRange = nightsInRange(r.checkIn, r.checkOut, f.range);
    nightsSold += inRange;
    if (startsInRange) {
      bookings++;
      stay += total;
      lead += Math.max(0, diffDays(r.createdAt.slice(0, 10), r.checkIn));
    }
    if (!countsAsRevenue(r) || inRange === 0 || total === 0) continue;
    const share = inRange / total;
    const g = toView(totalOf(r.breakdown) * share, r.currency, view);
    if (g == null) { excluded++; continue; }
    gross += g;
    fees += toView(r.breakdown.channelFee * share, r.currency, view) ?? 0;
    roomRevenue += toView(roomRevenueOf(r.breakdown) * share, r.currency, view) ?? 0;
    revenueNights += inRange;
  }

  const avail = f.channel && f.channel !== 'all' ? 0 : availableNights(src, f);
  return {
    bookings,
    nightsSold,
    availableNights: avail,
    occupancy: avail > 0 ? Math.min(1, nightsSold / avail) : 0,
    gross,
    fees,
    net: gross - fees,
    roomRevenue,
    adr: revenueNights > 0 ? roomRevenue / revenueNights : 0,
    revpar: avail > 0 ? roomRevenue / avail : 0,
    avgStay: bookings > 0 ? stay / bookings : 0,
    avgLeadDays: bookings > 0 ? lead / bookings : 0,
    cancellations,
    cancelRate: bookings + cancellations > 0 ? cancellations / (bookings + cancellations) : 0,
    excludedByCurrency: excluded,
  };
}

/** Reservas Confirmadas o Pendientes con saldo a cobrar. */
export function pendingPayments(src: MetricsSource, f: Pick<MetricsFilter, 'propertyId'>, view: MoneyView): { count: number; amount: number; list: Reservation[] } {
  const list = src.reservations.filter((r) => (r.status === 'confirmed' || r.status === 'pending') && inFilter(r, { ...f, range: { start: '', end: '' } }) && balanceOf(r, src.payments) > 0.005);
  const amount = list.reduce((s, r) => s + (toView(balanceOf(r, src.payments), r.currency, view) ?? 0), 0);
  return { count: list.length, amount, list };
}

/** Meses completos que tocan el período (como rangos [inicio, fin)). */
export function monthsIn(range: DateRange): { key: string; range: DateRange }[] {
  const out: { key: string; range: DateRange }[] = [];
  for (let m = startOfMonth(range.start); m < range.end; m = addMonths(m, 1)) out.push({ key: monthKey(m), range: { start: m, end: endOfMonthExclusive(m) } });
  return out;
}

/** Los últimos `n` meses terminando en el mes de `ref` (inclusive). */
export function lastMonths(ref: string, n: number): { key: string; range: DateRange }[] {
  const first = addMonths(startOfMonth(ref), -(n - 1));
  return monthsIn({ start: first, end: endOfMonthExclusive(ref) });
}

export const monthlySeries = (src: MetricsSource, months: { key: string; range: DateRange }[], f: Omit<MetricsFilter, 'range'>, view: MoneyView) =>
  months.map((m) => ({ key: m.key, ...rangeMetrics(src, { ...f, range: m.range }, view) }));

export const byChannel = (src: MetricsSource, f: MetricsFilter, view: MoneyView) =>
  CHANNEL_IDS.map((channel) => ({ channel, ...rangeMetrics(src, { ...f, channel }, view) }));

export const byProperty = (src: MetricsSource, f: MetricsFilter, view: MoneyView) =>
  src.properties
    .filter((p) => !f.propertyId || f.propertyId === 'all' || p.id === f.propertyId)
    .map((property) => ({ property, ...rangeMetrics(src, { ...f, propertyId: property.id }, view) }));

export interface ExpenseMetrics {
  total: number;
  unpaid: number;
  byCategory: { category: ExpenseCategory; amount: number }[];
  excludedByCurrency: number;
}

/** Gastos con fecha dentro del período. */
export function expenseMetrics(src: MetricsSource, f: MetricsFilter, view: MoneyView): ExpenseMetrics {
  const cat = new Map<ExpenseCategory, number>();
  let total = 0, unpaid = 0, excluded = 0;
  for (const e of src.expenses) {
    if (e.date < f.range.start || e.date >= f.range.end) continue;
    if (f.propertyId && f.propertyId !== 'all' && e.propertyId !== f.propertyId) continue;
    const v = toView(e.amount, e.currency, view);
    if (v == null) { excluded++; continue; }
    total += v;
    if (!e.paid) unpaid += v;
    cat.set(e.category, (cat.get(e.category) ?? 0) + v);
  }
  return { total, unpaid, byCategory: EXPENSE_CATEGORIES.map((category) => ({ category, amount: cat.get(category) ?? 0 })), excludedByCurrency: excluded };
}

/** Ocupación de un departamento en un mes (para tarjetas y tablas). */
export const occupancyOf = (src: MetricsSource, propertyId: ID, range: DateRange): number =>
  rangeMetrics(src, { range, propertyId }, { currency: 'USD', convert: false, demoRate: 0 }).occupancy;

export { netOf };
