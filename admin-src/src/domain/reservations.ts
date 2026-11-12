import type { CalendarBlock, ID, ISODate, Payment, PaymentStatus, PriceBreakdown, Reservation, ReservationStatus } from '@/types';
import { nightsBetween, rangesOverlap } from '@/lib/dates';

/** Estados que ocupan el departamento (bloquean fechas y cuentan como ocupación). */
export const ACTIVE_STATUSES: ReservationStatus[] = ['confirmed', 'pending', 'completed'];
/** Estados que cuentan como ingreso (una reserva pendiente todavía no es ingreso). */
export const REVENUE_STATUSES: ReservationStatus[] = ['confirmed', 'completed'];

export const isActive = (r: Reservation): boolean => ACTIVE_STATUSES.includes(r.status);
export const countsAsRevenue = (r: Reservation): boolean => REVENUE_STATUSES.includes(r.status);
export const nights = (r: Pick<Reservation, 'checkIn' | 'checkOut'>): number => nightsBetween(r.checkIn, r.checkOut);

/** Total que paga el huésped. La comisión del canal NO se suma: se descuenta del neto del anfitrión. */
export const totalOf = (b: PriceBreakdown): number => Math.max(0, round2(b.accommodation + b.cleaning - b.discount + b.taxes));
export const netOf = (b: PriceBreakdown): number => round2(totalOf(b) - b.channelFee);
/** Ingreso por alojamiento (sin limpieza ni impuestos), base de ADR y RevPAR. */
export const roomRevenueOf = (b: PriceBreakdown): number => Math.max(0, round2(b.accommodation - b.discount));

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export const paidOf = (reservationId: ID, payments: Payment[]): number =>
  round2(payments.filter((p) => p.reservationId === reservationId).reduce((s, p) => s + p.amount, 0));

export const balanceOf = (r: Reservation, payments: Payment[]): number => round2(totalOf(r.breakdown) - paidOf(r.id, payments));

export const paymentStatusOf = (r: Reservation, payments: Payment[]): PaymentStatus => {
  const paid = paidOf(r.id, payments);
  const total = totalOf(r.breakdown);
  if (paid <= 0) return total <= 0 ? 'paid' : 'unpaid';
  return paid + 0.005 >= total ? 'paid' : 'partial';
};

export type Conflict =
  | { kind: 'reservation'; reservation: Reservation }
  | { kind: 'block'; block: CalendarBlock };

/**
 * Busca lo primero que se pise con [start, end) en un departamento.
 * La salida es exclusiva: una reserva puede empezar el mismo día en que otra termina.
 */
export function findConflict(
  input: { propertyId: ID; start: ISODate; end: ISODate; ignoreReservationId?: ID; ignoreBlockId?: ID },
  reservations: Reservation[],
  blocks: CalendarBlock[],
): Conflict | null {
  const r = reservations.find(
    (x) => x.propertyId === input.propertyId && x.id !== input.ignoreReservationId && isActive(x) && rangesOverlap(input.start, input.end, x.checkIn, x.checkOut),
  );
  if (r) return { kind: 'reservation', reservation: r };
  const b = blocks.find((x) => x.propertyId === input.propertyId && x.id !== input.ignoreBlockId && rangesOverlap(input.start, input.end, x.start, x.end));
  return b ? { kind: 'block', block: b } : null;
}

/** Error de validación de dominio (fechas inválidas, superposición, etc.). El mensaje se muestra tal cual al usuario. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
