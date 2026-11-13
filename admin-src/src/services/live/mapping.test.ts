import { describe, expect, it } from 'vitest';
import type { B24Booking, B24RoomCalendar } from './raw';
import { blackoutsFrom, breakdownOf, channelOf, chargesFor, guestIdFor, paymentDescription, paymentsFrom, parsePaymentDescription, propertiesFrom, ratesFrom, reservationFrom, statusOf, toRanges } from './mapping';
import { totalOf } from '@/domain/reservations';

const booking = (o: Partial<B24Booking> = {}): B24Booking => ({ id: 1001, propertyId: 368016, roomId: 757554, status: 'confirmed', arrival: '2026-12-01', departure: '2026-12-04', numAdult: 2, numChild: 0, firstName: 'Ana', lastName: 'Pérez', email: 'Ana@Ejemplo.com', channel: 'direct', bookingTime: '2026-11-10T12:00:00Z', ...o });

describe('Beds24 → panel', () => {
  it('canales', () => {
    expect(channelOf('airbnb')).toBe('airbnb');
    expect(channelOf('airbnbical')).toBe('airbnb');
    expect(channelOf('booking')).toBe('booking');
    expect(channelOf('bookingpage')).toBe('web');
    expect(channelOf('direct')).toBe('manual');
    expect(channelOf(undefined)).toBe('manual');
  });
  it('estados', () => {
    expect(statusOf('new', '2026-12-04', '2026-11-13')).toBe('confirmed');
    expect(statusOf('confirmed', '2026-11-10', '2026-11-13')).toBe('completed');
    expect(statusOf('request', '2026-12-04', '2026-11-13')).toBe('pending');
    expect(statusOf('cancelled', '2026-12-04', '2026-11-13')).toBe('cancelled');
  });
  it('importes desde cargos de factura', () => {
    const b = booking({ commission: 12, invoiceItems: [
      { id: 1, type: 'charge', description: 'Alojamiento', qty: 1, amount: 300 },
      { id: 2, type: 'charge', description: 'Limpieza', qty: 1, amount: 25 },
      { id: 3, type: 'charge', description: 'Descuento', qty: 1, amount: -30 },
      { id: 4, type: 'payment', description: 'Transferencia · Seña', qty: 1, amount: 90, createTime: '2026-11-11T10:00:00Z' },
    ] });
    const br = breakdownOf(b);
    expect(br).toEqual({ accommodation: 300, cleaning: 25, discount: 30, taxes: 0, channelFee: 12 });
    expect(totalOf(br)).toBe(295);
    const pays = paymentsFrom(b, 'USD');
    expect(pays).toHaveLength(1);
    expect(pays[0]).toMatchObject({ amount: 90, method: 'transfer', note: 'Seña', date: '2026-11-11' });
  });
  it('sin cargos usa el precio de la reserva', () => {
    expect(breakdownOf(booking({ price: 210 }))).toMatchObject({ accommodation: 210, cleaning: 0 });
  });
  it('ida y vuelta de cargos', () => {
    const br = { accommodation: 400, cleaning: 30, discount: 40, taxes: 10, channelFee: 0 };
    const items = chargesFor(br).map((c, i) => ({ id: i, ...c }));
    expect(breakdownOf(booking({ invoiceItems: items }))).toEqual(br);
  });
  it('fecha del pago en la descripción', () => {
    const d = paymentDescription('cash', 'Saldo', '2026-11-02');
    expect(d).toBe('Efectivo · Saldo · fecha 02/11/2026');
    expect(parsePaymentDescription(d)).toEqual({ method: 'cash', note: 'Saldo', date: '2026-11-02' });
    expect(parsePaymentDescription('Pago Airbnb')).toEqual({ method: 'other', note: 'Pago Airbnb', date: undefined });
  });
  it('mismo huésped en varias reservas (por email, sin importar mayúsculas)', () => {
    expect(guestIdFor({ email: 'ana@ejemplo.com' })).toBe(guestIdFor({ email: ' ANA@ejemplo.com', firstName: 'Otra' }));
    expect(guestIdFor({ firstName: 'Juan', lastName: 'Gómez', phone: '+54 261 555' })).toBe(guestIdFor({ firstName: 'juan', lastName: 'gomez', mobile: '54261555' }));
  });
  it('reserva', () => {
    const r = reservationFrom(booking({ notes: 'Llega tarde', infoItems: [{ id: 9, code: 'NOTA', text: '[Marcos] Pidió cuna', createTime: '2026-11-12T09:00:00Z' }, { id: 10, code: 'OTRA', text: 'x' }] }), 'prop_b24_757554', 'USD', '2026-11-13');
    expect(r).toMatchObject({ id: 'res_b24_1001', code: '1001', checkIn: '2026-12-01', checkOut: '2026-12-04', observations: 'Llega tarde', status: 'confirmed', channel: 'manual' });
    expect(r.notes).toEqual([{ id: 'note_b24_9', at: '2026-11-12T09:00:00Z', author: 'Marcos', text: 'Pidió cuna' }]);
  });
  it('departamentos con fotos del sitio', () => {
    const [p] = propertiesFrom([{ id: 368016, name: 'Mitre I', currency: 'USD', address: 'Mitre 753', city: 'Mendoza', checkInStart: '14:00', checkOutEnd: '10:00', roomTypes: [{ id: 757554, name: 'Mitre I', maxPeople: 4, minStay: 1, maxStay: 365 }] }], {});
    expect(p).toMatchObject({ id: 'prop_b24_757554', internalName: 'Mitre I', capacity: 4, bedrooms: 2, basePrice: 65, checkInTime: '14:00' });
    expect(p.photos[0]).toContain('/img/apts/mitre-i/');
    expect(p.amenities).toContain('Pileta');
  });
});

describe('calendario', () => {
  const cal: B24RoomCalendar[] = [{ roomId: 757554, propertyId: 368016, calendar: [
    { from: '2026-12-01', to: '2026-12-03', price1: 65, minStay: 1, override: 'none' },
    { from: '2026-12-04', to: '2026-12-05', price1: 80, minStay: 2, override: 'blackout' },
    { from: '2026-12-06', to: '2026-12-06', minStay: 1, override: 'blackout' },
  ] }];
  it('precios por fecha (to inclusivo)', () => {
    const r = ratesFrom(cal);
    expect(r.filter((x) => x.price === 65).map((x) => x.date)).toEqual(['2026-12-01', '2026-12-02', '2026-12-03']);
    expect(r.find((x) => x.date === '2026-12-05')).toMatchObject({ price: 80, minStay: 2 });
  });
  it('cierres seguidos se juntan en un bloqueo (fin exclusivo)', () => {
    expect(blackoutsFrom(cal)).toEqual([expect.objectContaining({ start: '2026-12-04', end: '2026-12-07', propertyId: 'prop_b24_757554' })]);
  });
  it('fechas sueltas a tramos', () => {
    expect(toRanges(['2026-12-03', '2026-12-01', '2026-12-02', '2026-12-05'])).toEqual([{ from: '2026-12-01', to: '2026-12-03' }, { from: '2026-12-05', to: '2026-12-05' }]);
  });
});
