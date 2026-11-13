import type { CalendarBlock, Dataset, ID, Reservation } from '@/types';
import { fmtDate, isValidDate } from '@/lib/dates';
import { DomainError, findConflict } from './reservations';

/**
 * Validaciones de reservas y bloqueos. Las usan todas las fuentes de datos (demo y Beds24) antes de escribir.
 * Con Beds24 además se pide `checkAvailability`, así Beds24 rechaza si un canal ocupó las fechas un instante antes.
 */
type DS = Pick<Dataset, 'properties' | 'guests' | 'reservations' | 'blocks'>;

export function validateStay(ds: DS, r: Pick<Reservation, 'propertyId' | 'checkIn' | 'checkOut' | 'status' | 'adults' | 'children' | 'guestId' | 'breakdown'>, ignoreId?: ID): void {
  const property = ds.properties.find((p) => p.id === r.propertyId);
  if (!property) throw new DomainError('Elegí un departamento.');
  if (!ds.guests.some((g) => g.id === r.guestId)) throw new DomainError('Elegí o cargá un huésped.');
  if (!isValidDate(r.checkIn) || !isValidDate(r.checkOut)) throw new DomainError('Las fechas no son válidas.');
  if (r.checkOut <= r.checkIn) throw new DomainError('El check-out tiene que ser posterior al check-in.');
  if (r.adults < 1) throw new DomainError('Tiene que haber al menos un adulto.');
  if (r.adults + r.children > property.capacity) throw new DomainError(`${property.internalName} admite hasta ${property.capacity} huéspedes.`);
  const b = r.breakdown;
  if ([b.accommodation, b.cleaning, b.discount, b.taxes, b.channelFee].some((n) => !Number.isFinite(n) || n < 0)) throw new DomainError('Los importes no pueden ser negativos.');
  if (r.status === 'cancelled') return;
  const conflict = findConflict({ propertyId: r.propertyId, start: r.checkIn, end: r.checkOut, ignoreReservationId: ignoreId }, ds.reservations, ds.blocks);
  if (conflict?.kind === 'reservation') {
    const c = conflict.reservation;
    throw new DomainError(`Se superpone con la reserva ${c.code} (${fmtDate(c.checkIn)} al ${fmtDate(c.checkOut)}).`);
  }
  if (conflict?.kind === 'block') throw new DomainError(`Esas fechas están bloqueadas: ${conflict.block.reason || 'bloqueo'} (${fmtDate(conflict.block.start)} al ${fmtDate(conflict.block.end)}).`);
}

export function validateBlock(ds: DS, b: Omit<CalendarBlock, 'id'>, ignoreId?: ID): void {
  if (!ds.properties.some((p) => p.id === b.propertyId)) throw new DomainError('Elegí un departamento.');
  if (!isValidDate(b.start) || !isValidDate(b.end)) throw new DomainError('Las fechas no son válidas.');
  if (b.end <= b.start) throw new DomainError('La fecha de fin tiene que ser posterior a la de inicio.');
  const conflict = findConflict({ propertyId: b.propertyId, start: b.start, end: b.end, ignoreBlockId: ignoreId }, ds.reservations, ds.blocks);
  if (conflict?.kind === 'reservation') throw new DomainError(`Hay una reserva activa en esas fechas: ${conflict.reservation.code}.`);
  if (conflict?.kind === 'block') throw new DomainError('Ya hay otro bloqueo en esas fechas.');
}

