import type {
  BlockType, CalendarBlock, ChannelId, Conversation, Currency, Guest, HistoryEntry, ID, ISODate, Note, Payment, PaymentMethod, PriceBreakdown, Property, Rate, Reservation, ReservationStatus,
} from '@/types';
import { addDays, eachDay } from '@/lib/dates';
import { PAY_METHOD } from '@/lib/labels';
import type { B24Booking, B24InvoiceItem, B24Message, B24Property, B24Room, B24RoomCalendar, B24Status } from './raw';
import { findCatalog } from './catalog';

/**
 * Traducción entre Beds24 y los modelos del panel. Funciones puras (sin red), probadas en mapping.test.ts.
 *
 * Correspondencias:
 * - Cada habitación (roomType) de Beds24 es un departamento del panel. Hoy cada alojamiento tiene una sola.
 * - Reserva con estado "black" = bloqueo. El resto son reservas.
 * - Cobros = ítems de factura tipo "payment". Cargos = ítems tipo "charge" (alojamiento, limpieza, descuento, impuestos).
 * - Notas internas = "info items" con código NOTA. Observaciones = campo `notes` de la reserva.
 */

export const ids = {
  property: (roomId: number) => `prop_b24_${roomId}`,
  unit: (roomId: number) => `unit_b24_${roomId}`,
  reservation: (bookingId: number) => `res_b24_${bookingId}`,
  block: (bookingId: number) => `blk_b24_${bookingId}`,
  calendarBlock: (roomId: number, from: string) => `blk_cal_${roomId}_${from}`,
  payment: (itemId: number) => `pay_b24_${itemId}`,
  note: (itemId: number) => `note_b24_${itemId}`,
  conversation: (bookingId: number) => `cnv_b24_${bookingId}`,
};

/** Número de Beds24 dentro de un id del panel (res_b24_123 → 123). */
export const b24Number = (id: ID): number => {
  const n = Number(id.split('_').pop());
  if (!Number.isFinite(n)) throw new Error(`Id sin número de Beds24: ${id}`);
  return n;
};
export const isCalendarBlock = (id: ID): boolean => id.startsWith('blk_cal_');

export const NOTE_CODE = 'NOTA';

/* ---------- Canales y estados ---------- */

export function channelOf(channel: string | undefined | null): ChannelId {
  const c = (channel ?? '').toLowerCase();
  if (c === 'airbnb' || c === 'airbnbical') return 'airbnb';
  if (c === 'booking') return 'booking';
  if (c === 'bookingpage') return 'web';
  return 'manual';
}

export function statusOf(status: B24Status, checkOut: ISODate, today: ISODate): ReservationStatus {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'request' || status === 'inquiry') return 'pending';
  return checkOut <= today ? 'completed' : 'confirmed';
}

export function b24StatusOf(status: ReservationStatus): B24Status {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'pending') return 'request';
  return 'confirmed';
}

/* ---------- Países ---------- */

const CODES: Record<string, string> = {
  Argentina: 'AR', Brasil: 'BR', Chile: 'CL', Uruguay: 'UY', Paraguay: 'PY', Perú: 'PE', Colombia: 'CO', México: 'MX', 'Estados Unidos': 'US',
  España: 'ES', Francia: 'FR', Alemania: 'DE', 'Reino Unido': 'GB', Italia: 'IT',
};
let regionNames: Intl.DisplayNames | null = null;
export function countryName(code: string | null | undefined, free?: string): string {
  if (code && /^[A-Z]{2}$/i.test(code)) {
    try {
      regionNames ??= new Intl.DisplayNames(['es'], { type: 'region' });
      return regionNames.of(code.toUpperCase()) ?? code;
    } catch {
      return code.toUpperCase();
    }
  }
  return (free ?? '').trim() || 'Sin dato';
}
export const countryCode = (name: string): string | undefined => CODES[name];

/* ---------- Huéspedes ---------- */

const hash = (s: string): string => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
};
const norm = (s: string | undefined): string => (s ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** El mismo huésped en varias reservas: se identifica por email; si no hay, por nombre y teléfono. */
export function guestKey(g: { email?: string; firstName?: string; lastName?: string; phone?: string; mobile?: string }): string {
  const email = norm(g.email);
  if (email.includes('@')) return `e:${email}`;
  return `n:${norm(g.firstName)} ${norm(g.lastName)}|${(g.mobile || g.phone || '').replace(/\D/g, '')}`;
}
export const guestIdFor = (g: Parameters<typeof guestKey>[0]): ID => `gst_b24_${hash(guestKey(g))}`;

export function guestFromBooking(b: B24Booking): Omit<Guest, 'notes' | 'preferences'> {
  return {
    id: guestIdFor(b),
    firstName: (b.firstName ?? '').trim() || 'Sin nombre',
    lastName: (b.lastName ?? '').trim(),
    email: (b.email ?? '').trim(),
    phone: (b.mobile || b.phone || '').trim(),
    country: countryName(b.country2, b.country),
    createdAt: b.bookingTime ?? new Date(0).toISOString(),
    external: { beds24BookingId: String(b.id) },
  };
}

/** Campos de contacto de la reserva a partir de un huésped del panel. */
export function bookingGuestFields(g: Pick<Guest, 'firstName' | 'lastName' | 'email' | 'phone' | 'country'>) {
  return { firstName: g.firstName, lastName: g.lastName, email: g.email, mobile: g.phone, country2: countryCode(g.country) ?? '', country: g.country };
}

/* ---------- Importes ---------- */

const lineTotal = (i: B24InvoiceItem): number => (typeof i.lineTotal === 'number' ? i.lineTotal : (i.qty ?? 1) * (i.amount ?? 0));
const round2 = (n: number) => Math.round(n * 100) / 100;

export function breakdownOf(b: B24Booking): PriceBreakdown {
  const charges = (b.invoiceItems ?? []).filter((i) => i.type === 'charge');
  const fee = Math.max(0, Number(b.commission) || 0);
  if (charges.length === 0) return { accommodation: Math.max(0, Number(b.price) || 0), cleaning: 0, discount: 0, taxes: 0, channelFee: fee };
  let cleaning = 0, taxes = 0, discount = 0, total = 0;
  for (const c of charges) {
    const t = lineTotal(c);
    total += t;
    const d = c.description ?? '';
    if (t < 0) discount += -t;
    else if (/limpieza|cleaning/i.test(d)) cleaning += t;
    else if (/impuesto|tax|iva/i.test(d)) taxes += t;
  }
  return { accommodation: round2(total - cleaning - taxes + discount), cleaning: round2(cleaning), discount: round2(discount), taxes: round2(taxes), channelFee: fee };
}

/** Cargos que el panel escribe en la factura de una reserva. */
export function chargesFor(b: PriceBreakdown): { type: 'charge'; qty: number; amount: number; description: string }[] {
  const out = [{ type: 'charge' as const, qty: 1, amount: b.accommodation, description: 'Alojamiento' }];
  if (b.cleaning > 0) out.push({ type: 'charge', qty: 1, amount: b.cleaning, description: 'Limpieza' });
  if (b.discount > 0) out.push({ type: 'charge', qty: 1, amount: -b.discount, description: 'Descuento' });
  if (b.taxes > 0) out.push({ type: 'charge', qty: 1, amount: b.taxes, description: 'Impuestos' });
  return out;
}

const METHOD_BY_LABEL = new Map((Object.entries(PAY_METHOD) as [PaymentMethod, string][]).map(([k, v]) => [v.toLowerCase(), k]));
/** "Transferencia · Seña · fecha 10/11/2026". La fecha se agrega sólo si no es la del día en que se carga (Beds24 guarda la hora de carga). */
export function paymentDescription(method: PaymentMethod, note: string, date?: ISODate): string {
  const parts = [PAY_METHOD[method], note.trim()];
  if (date) parts.push(`fecha ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`);
  return parts.filter(Boolean).join(' · ');
}
export function parsePaymentDescription(d: string | undefined): { method: PaymentMethod; note: string; date?: ISODate } {
  let text = (d ?? '').trim();
  let date: ISODate | undefined;
  const m = /(?:^| · )fecha (\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (m) { date = `${m[3]}-${m[2]}-${m[1]}`; text = text.slice(0, m.index); }
  const [first, ...rest] = text.split(' · ');
  const method = METHOD_BY_LABEL.get(first.trim().toLowerCase());
  return method ? { method, note: rest.join(' · '), date } : { method: 'other', note: text, date };
}

/* ---------- Departamentos ---------- */

export interface PropertyProfile {
  publicName?: string;
  description?: string;
  photos?: string[];
  amenities?: string[];
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  active?: boolean;
  basePrice?: number;
}

const toTime = (t: string | undefined, fallback: string) => (t && /^\d{2}:\d{2}$/.test(t) && t !== '24:00' ? t : fallback);
const asCurrency = (c: string | undefined): Currency => (c?.toUpperCase() === 'ARS' ? 'ARS' : 'USD');

/** Un departamento del panel por cada habitación de Beds24. */
export function propertiesFrom(list: B24Property[], profiles: Record<ID, PropertyProfile>): Property[] {
  const out: Property[] = [];
  for (const p of list) {
    const rooms = p.roomTypes ?? [];
    for (const room of rooms) {
      const id = ids.property(room.id);
      const name = rooms.length > 1 ? `${p.name} · ${room.name}` : p.name;
      const cat = findCatalog(name) ?? findCatalog(room.name);
      const prof = profiles[id] ?? {};
      out.push({
        id,
        internalName: name,
        publicName: prof.publicName ?? cat?.publicName ?? name,
        description: prof.description ?? '',
        address: p.address ?? '',
        city: p.city ?? '',
        capacity: room.maxPeople ?? 1,
        bedrooms: prof.bedrooms ?? cat?.bedrooms ?? 1,
        beds: prof.beds ?? cat?.beds ?? 1,
        bathrooms: prof.bathrooms ?? cat?.bathrooms ?? 1,
        photos: prof.photos ?? cat?.photos ?? [],
        amenities: prof.amenities ?? cat?.amenities ?? [],
        checkInTime: toTime(p.checkInStart, '14:00'),
        checkOutTime: toTime(p.checkOutEnd, '10:00'),
        currency: asCurrency(p.currency),
        basePrice: prof.basePrice ?? cat?.basePrice ?? 0,
        cleaningFee: room.cleaningFee ?? 0,
        minStay: room.minStay ?? 1,
        maxStay: room.maxStay ?? 365,
        weeklyDiscount: 0,
        monthlyDiscount: 0,
        active: prof.active ?? true,
        units: [{ id: ids.unit(room.id), propertyId: id, name: room.name, external: { beds24RoomId: String(room.id) } }],
        external: { beds24PropertyId: String(p.id), beds24RoomId: String(room.id) },
      });
    }
  }
  return out;
}

/* ---------- Reservas, bloqueos y cobros ---------- */

export function reservationFrom(b: B24Booking, propertyId: ID, currency: Currency, today: ISODate): Reservation {
  const history: HistoryEntry[] = [];
  if (b.bookingTime) history.push({ id: `h_${b.id}_c`, at: b.bookingTime, action: 'Reserva creada', detail: `Origen: ${b.channel || b.referer || 'directo'}` });
  if (b.modifiedTime && b.modifiedTime !== b.bookingTime) history.push({ id: `h_${b.id}_m`, at: b.modifiedTime, action: 'Última modificación en Beds24' });
  if (b.cancelTime) history.push({ id: `h_${b.id}_x`, at: b.cancelTime, action: 'Reserva cancelada' });
  for (const p of (b.invoiceItems ?? []).filter((i) => i.type === 'payment' && i.createTime)) {
    history.push({ id: `h_${b.id}_p${p.id}`, at: p.createTime!, action: 'Pago registrado', detail: `${currency} ${lineTotal(p)}` });
  }
  history.sort((a, c) => a.at.localeCompare(c.at));
  const notes: Note[] = (b.infoItems ?? []).filter((i) => (i.code ?? '').toUpperCase() === NOTE_CODE).map((i) => {
    const m = /^\[(.+?)\]\s*([\s\S]*)$/.exec(i.text ?? '');
    return { id: ids.note(i.id), at: i.createTime ?? b.modifiedTime ?? '', author: m ? m[1] : 'Beds24', text: m ? m[2] : i.text ?? '' };
  });
  return {
    id: ids.reservation(b.id),
    code: String(b.id),
    propertyId,
    unitId: ids.unit(b.roomId),
    guestId: guestIdFor(b),
    channel: channelOf(b.channel),
    checkIn: b.arrival,
    checkOut: b.departure,
    adults: Math.max(1, b.numAdult ?? 1),
    children: Math.max(0, b.numChild ?? 0),
    status: statusOf(b.status, b.departure, today),
    currency,
    breakdown: breakdownOf(b),
    observations: (b.notes ?? '').trim(),
    notes,
    history,
    createdAt: b.bookingTime ?? new Date(0).toISOString(),
    cancelledAt: b.cancelTime ?? undefined,
    external: { beds24BookingId: String(b.id), beds24RoomId: String(b.roomId), channelReference: b.apiReference || undefined },
  };
}

const BLOCK_TYPES: BlockType[] = ['maintenance', 'owner', 'other'];
export function blockFrom(b: B24Booking, propertyId: ID): CalendarBlock {
  const type = BLOCK_TYPES.includes(b.custom10 as BlockType) ? (b.custom10 as BlockType) : 'other';
  return { id: ids.block(b.id), propertyId, start: b.arrival, end: b.departure, type, reason: (b.notes || b.lastName || '').trim() };
}

export function paymentsFrom(b: B24Booking, currency: Currency): Payment[] {
  return (b.invoiceItems ?? [])
    .filter((i) => i.type === 'payment')
    .map((i) => {
      const { method, note, date } = parsePaymentDescription(i.description);
      return { id: ids.payment(i.id), reservationId: ids.reservation(b.id), date: date ?? (i.createTime ?? b.modifiedTime ?? '').slice(0, 10), amount: round2(Math.abs(lineTotal(i))), currency, method, note };
    });
}

/* ---------- Calendario: precios y cierres ---------- */

export function ratesFrom(cal: B24RoomCalendar[]): Rate[] {
  const out: Rate[] = [];
  for (const room of cal) {
    for (const r of room.calendar ?? []) {
      if (r.price1 == null && r.minStay == null) continue;
      for (const date of eachDay(r.from, addDays(r.to, 1))) out.push({ propertyId: ids.property(room.roomId), date, price: r.price1 ?? undefined, minStay: r.minStay ?? undefined });
    }
  }
  return out;
}

/** Fechas cerradas a mano en el calendario de Beds24 (override "blackout"): se muestran como bloqueos. */
export function blackoutsFrom(cal: B24RoomCalendar[]): CalendarBlock[] {
  const out: CalendarBlock[] = [];
  for (const room of cal) {
    const ranges = (room.calendar ?? []).filter((r) => r.override === 'blackout').sort((a, b) => a.from.localeCompare(b.from));
    let cur: { from: string; to: string } | null = null;
    const flush = () => { if (cur) out.push({ id: ids.calendarBlock(room.roomId, cur.from), propertyId: ids.property(room.roomId), start: cur.from, end: addDays(cur.to, 1), type: 'other', reason: 'Cerrado en el calendario de Beds24' }); };
    for (const r of ranges) {
      if (cur && addDays(cur.to, 1) === r.from) cur.to = r.to;
      else { flush(); cur = { from: r.from, to: r.to }; }
    }
    flush();
  }
  return out;
}

/** Agrupa fechas sueltas en tramos consecutivos (from/to inclusivos, como espera Beds24). */
export function toRanges(dates: ISODate[]): { from: ISODate; to: ISODate }[] {
  const sorted = [...new Set(dates)].sort();
  const out: { from: ISODate; to: ISODate }[] = [];
  for (const d of sorted) {
    const last = out[out.length - 1];
    if (last && addDays(last.to, 1) === d) last.to = d;
    else out.push({ from: d, to: d });
  }
  return out;
}

/* ---------- Mensajes ---------- */

export function conversationsFrom(messages: B24Message[], bookingIndex: Map<number, { reservation: Reservation }>): Conversation[] {
  const byBooking = new Map<number, B24Message[]>();
  for (const m of messages) {
    if (m.source !== 'guest' && m.source !== 'host') continue;
    if (!bookingIndex.has(m.bookingId)) continue;
    const list = byBooking.get(m.bookingId) ?? [];
    list.push(m);
    byBooking.set(m.bookingId, list);
  }
  const out: Conversation[] = [];
  for (const [bookingId, list] of byBooking) {
    const r = bookingIndex.get(bookingId)!.reservation;
    list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    out.push({
      id: ids.conversation(bookingId),
      guestId: r.guestId,
      propertyId: r.propertyId,
      reservationId: r.id,
      channel: r.channel,
      unread: list.some((m) => m.source === 'guest' && m.read === false),
      messages: list.map((m) => ({ id: `msg_b24_${m.id}`, at: m.time ?? '', from: m.source === 'guest' ? 'guest' : 'host', text: m.message ?? '' })),
    });
  }
  return out;
}

export type { B24Room };
