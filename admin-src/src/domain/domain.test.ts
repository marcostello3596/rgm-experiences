import { describe, expect, it } from 'vitest';
import type { CalendarBlock, Property, Reservation } from '@/types';
import { findConflict, paymentStatusOf, totalOf } from './reservations';
import { indexRates, priceForNight, quoteStay } from './pricing';
import { rangeMetrics } from './metrics';
import { toView } from './money';
import { buildDataset } from '@/services/mock/seed';
import { nightsInRange, rangesOverlap } from '@/lib/dates';

const res = (o: Partial<Reservation>): Reservation => ({
  id: 'r1', code: 'RGM-1', propertyId: 'p1', guestId: 'g1', channel: 'manual', checkIn: '2026-11-10', checkOut: '2026-11-14', adults: 2, children: 0, status: 'confirmed', currency: 'USD',
  breakdown: { accommodation: 400, cleaning: 20, discount: 0, taxes: 0, channelFee: 40 }, observations: '', notes: [], history: [], createdAt: '2026-11-01T12:00:00.000Z', ...o,
});
const prop = (o: Partial<Property> = {}): Property => ({
  id: 'p1', internalName: 'P', publicName: 'P', description: '', address: '', city: '', capacity: 4, bedrooms: 1, beds: 2, bathrooms: 1, photos: [], amenities: [], checkInTime: '15:00', checkOutTime: '10:00',
  currency: 'USD', basePrice: 100, weekendPrice: 120, cleaningFee: 20, minStay: 1, maxStay: 30, weeklyDiscount: 10, monthlyDiscount: 20, active: true, units: [], external: {}, ...o,
});

describe('fechas', () => {
  it('la salida es exclusiva', () => {
    expect(rangesOverlap('2026-11-10', '2026-11-14', '2026-11-14', '2026-11-16')).toBe(false);
    expect(rangesOverlap('2026-11-10', '2026-11-14', '2026-11-13', '2026-11-16')).toBe(true);
    expect(nightsInRange('2026-10-30', '2026-11-03', { start: '2026-11-01', end: '2026-12-01' })).toBe(2);
  });
});

describe('superposición', () => {
  const existing = [res({})];
  const blocks: CalendarBlock[] = [{ id: 'b1', propertyId: 'p1', start: '2026-11-20', end: '2026-11-22', type: 'maintenance', reason: '' }];
  it('permite entrar el día en que otra reserva sale', () => {
    expect(findConflict({ propertyId: 'p1', start: '2026-11-14', end: '2026-11-17' }, existing, blocks)).toBeNull();
    expect(findConflict({ propertyId: 'p1', start: '2026-11-07', end: '2026-11-10' }, existing, blocks)).toBeNull();
  });
  it('detecta reservas y bloqueos', () => {
    expect(findConflict({ propertyId: 'p1', start: '2026-11-13', end: '2026-11-15' }, existing, blocks)?.kind).toBe('reservation');
    expect(findConflict({ propertyId: 'p1', start: '2026-11-19', end: '2026-11-21' }, existing, blocks)?.kind).toBe('block');
  });
  it('ignora canceladas, otros departamentos y la propia reserva', () => {
    expect(findConflict({ propertyId: 'p1', start: '2026-11-11', end: '2026-11-12' }, [res({ status: 'cancelled' })], [])).toBeNull();
    expect(findConflict({ propertyId: 'p2', start: '2026-11-11', end: '2026-11-12' }, existing, [])).toBeNull();
    expect(findConflict({ propertyId: 'p1', start: '2026-11-11', end: '2026-11-12', ignoreReservationId: 'r1' }, existing, [])).toBeNull();
  });
});

describe('importes', () => {
  it('total y estado de pago', () => {
    const r = res({});
    expect(totalOf(r.breakdown)).toBe(420);
    expect(paymentStatusOf(r, [])).toBe('unpaid');
    expect(paymentStatusOf(r, [{ id: 'x', reservationId: 'r1', date: '2026-11-01', amount: 100, currency: 'USD', method: 'cash', note: '' }])).toBe('partial');
    expect(paymentStatusOf(r, [{ id: 'x', reservationId: 'r1', date: '2026-11-01', amount: 420, currency: 'USD', method: 'cash', note: '' }])).toBe('paid');
  });
  it('no mezcla monedas sin conversión', () => {
    expect(toView(1200, 'ARS', { currency: 'USD', convert: false, demoRate: 1200 })).toBeNull();
    expect(toView(1200, 'ARS', { currency: 'USD', convert: true, demoRate: 1200 })).toBe(1);
    expect(toView(2, 'USD', { currency: 'ARS', convert: true, demoRate: 1200 })).toBe(2400);
  });
});

describe('tarifas', () => {
  const p = prop();
  it('prioridad: fecha > temporada > fin de semana > base', () => {
    const seasons = [{ id: 's', name: 'Alta', type: 'high' as const, start: '2026-12-01', end: '2026-12-31', adjustPct: 20 }];
    const rates = indexRates([{ propertyId: 'p1', date: '2026-12-05', price: 300 }]);
    expect(priceForNight(p, '2026-11-10', rates, seasons).price).toBe(100); // martes
    expect(priceForNight(p, '2026-11-13', rates, seasons).price).toBe(120); // viernes
    expect(priceForNight(p, '2026-12-08', rates, seasons).price).toBe(120); // temporada +20 %
    expect(priceForNight(p, '2026-12-05', rates, seasons).price).toBe(300); // cargada a mano
  });
  it('descuento semanal', () => {
    const q = quoteStay(p, '2026-11-09', '2026-11-16', new Map(), []);
    expect(q.nights).toBe(7);
    expect(q.accommodation).toBe(5 * 100 + 2 * 120);
    expect(q.discount).toBe(74);
  });
});

describe('indicadores', () => {
  const range = { start: '2026-11-01', end: '2026-12-01' };
  const view = { currency: 'USD' as const, convert: false, demoRate: 1200 };
  it('ocupación, ADR y RevPAR', () => {
    const m = rangeMetrics({ reservations: [res({}), res({ id: 'r2', status: 'cancelled' })], payments: [], properties: [prop()], blocks: [], expenses: [] }, { range }, view);
    expect(m.nightsSold).toBe(4);
    expect(m.availableNights).toBe(30);
    expect(m.occupancy).toBeCloseTo(4 / 30);
    expect(m.gross).toBe(420);
    expect(m.net).toBe(380);
    expect(m.adr).toBe(100);
    expect(m.revpar).toBeCloseTo(400 / 30);
    expect(m.cancellations).toBe(1);
  });
  it('reparte por noches cuando la reserva cruza el período', () => {
    const m = rangeMetrics({ reservations: [res({ checkIn: '2026-10-30', checkOut: '2026-11-03' })], payments: [], properties: [prop()], blocks: [], expenses: [] }, { range }, view);
    expect(m.nightsSold).toBe(2);
    expect(m.gross).toBe(210);
    expect(m.bookings).toBe(0);
  });
});

describe('datos de demostración', () => {
  const ds = buildDataset('2026-11-11');
  it('12 departamentos y entre 40 y 70 reservas', () => {
    expect(ds.properties).toHaveLength(12);
    expect(ds.reservations.length).toBeGreaterThanOrEqual(40);
    expect(ds.reservations.length).toBeLessThanOrEqual(70);
  });
  it('no hay reservas activas superpuestas ni sobre bloqueos', () => {
    for (const r of ds.reservations.filter((x) => x.status !== 'cancelled')) {
      expect(findConflict({ propertyId: r.propertyId, start: r.checkIn, end: r.checkOut, ignoreReservationId: r.id }, ds.reservations, ds.blocks)).toBeNull();
    }
  });
  it('usa los cuatro canales y tiene pasado, presente y futuro', () => {
    expect(new Set(ds.reservations.map((r) => r.channel)).size).toBe(4);
    expect(ds.reservations.some((r) => r.checkOut < '2026-11-11')).toBe(true);
    expect(ds.reservations.some((r) => r.checkIn <= '2026-11-11' && r.checkOut > '2026-11-11')).toBe(true);
    expect(ds.reservations.some((r) => r.checkIn > '2026-11-11')).toBe(true);
  });
  it('genera una limpieza por cada check-out activo', () => {
    const active = ds.reservations.filter((r) => r.status !== 'cancelled');
    expect(ds.tasks.filter((t) => t.type === 'cleaning')).toHaveLength(active.length);
  });
});
