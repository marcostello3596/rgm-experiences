import type { Currency, Guest, ID, ISODate, Payment, Reservation } from '@/types';
import { balanceOf, countsAsRevenue, totalOf } from './reservations';

export interface GuestStats {
  /** Reservas no canceladas. */
  bookings: number;
  cancelled: number;
  /** Último check-out ya ocurrido. */
  lastStay: ISODate | null;
  nextStay: ISODate | null;
  /** Total de reservas confirmadas o finalizadas, por moneda (nunca se suman entre sí). */
  spent: Record<Currency, number>;
  owed: Record<Currency, number>;
}

export function guestStats(guests: Guest[], reservations: Reservation[], payments: Payment[], today: ISODate): Map<ID, GuestStats> {
  const map = new Map<ID, GuestStats>(guests.map((g) => [g.id, { bookings: 0, cancelled: 0, lastStay: null, nextStay: null, spent: { USD: 0, ARS: 0 }, owed: { USD: 0, ARS: 0 } }]));
  for (const r of reservations) {
    const s = map.get(r.guestId);
    if (!s) continue;
    if (r.status === 'cancelled') { s.cancelled++; continue; }
    s.bookings++;
    if (r.checkOut <= today && (!s.lastStay || r.checkOut > s.lastStay)) s.lastStay = r.checkOut;
    if (r.checkOut > today && (!s.nextStay || r.checkIn < s.nextStay)) s.nextStay = r.checkIn;
    if (countsAsRevenue(r)) s.spent[r.currency] += totalOf(r.breakdown);
    const balance = balanceOf(r, payments);
    if (balance > 0.005) s.owed[r.currency] += balance;
  }
  return map;
}
