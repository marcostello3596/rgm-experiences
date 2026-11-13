import type { CalendarBlock, Channel, Dataset, Expense, Guest, ID, Message, MessageTemplate, Note, Payment, Property, Reservation, Settings, SyncStatus, Task } from '@/types';
import type { NewReservation, RateChange, ReservationPatch, Services } from '../contracts';
import { addDays, eachDay, isValidDate, today as todayIn, weekday } from '@/lib/dates';
import { uid } from '@/lib/cn';
import { money } from '@/lib/format';
import { BLOCK_TYPE } from '@/lib/labels';
import { DomainError, isActive, paidOf, totalOf } from '@/domain/reservations';
import { validateBlock, validateStay } from '@/domain/validation';
import { syncCleaningTasks } from '@/domain/tasks';
import { AuthError, beds24 } from './api';
import type { B24Booking, B24Message, B24Property, B24RoomCalendar } from './raw';
import {
  b24Number, b24StatusOf, blackoutsFrom, blockFrom, bookingGuestFields, chargesFor, conversationsFrom, guestFromBooking, guestIdFor, ids, isCalendarBlock,
  NOTE_CODE, paymentDescription, paymentsFrom, propertiesFrom, ratesFrom, reservationFrom, toRanges, type PropertyProfile,
} from './mapping';
import { local, logSync, saveLocal } from './local';

/**
 * IMPLEMENTACIÓN CON BEDS24.
 *
 * Beds24 es la fuente de verdad de departamentos, reservas, bloqueos, precios por fecha, cobros y mensajes.
 * Este módulo trae esos datos a través del puente del servidor (/api/admin/beds24), los traduce a los modelos
 * del panel (mapping.ts) y escribe cada cambio en Beds24. Después de escribir, vuelve a leer lo que cambió.
 *
 * Lo que Beds24 no guarda (gastos, tareas, configuración, plantillas, notas de huéspedes, fotos y comodidades)
 * se guarda en este navegador (local.ts).
 */

type Segment = 'properties' | 'bookings' | 'calendar' | 'messages';
const ALL: Segment[] = ['properties', 'bookings', 'calendar', 'messages'];
const BOOKING_STATUSES = ['confirmed', 'request', 'new', 'cancelled', 'black', 'inquiry'];
const HISTORY_DAYS = 400;
const FUTURE_DAYS = 560;
const LOCAL_PROPERTY_FIELDS: (keyof Property)[] = ['publicName', 'description', 'photos', 'amenities', 'bedrooms', 'beds', 'bathrooms', 'active', 'basePrice'];

const raw: { properties: B24Property[]; bookings: B24Booking[]; calendar: B24RoomCalendar[]; messages: B24Message[] } = { properties: [], bookings: [], calendar: [], messages: [] };
const dirty = new Set<Segment>(ALL);

/*
 * Beds24 permite unos 100 pedidos cada 5 minutos. Para no gastarlos al recargar la página, la última lectura
 * se guarda en la sesión del navegador (sessionStorage, se borra al cerrar la pestaña) y se reutiliza si tiene
 * menos de 2 minutos.
 */
const CACHE_KEY = 'rgm-pms-beds24-cache';
const CACHE_MS = 2 * 60 * 1000;
function saveCache(): void {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), raw })); } catch { /* sin almacenamiento de sesión */ }
}
function loadCache(): void {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null') as { at: number; raw: typeof raw } | null;
    if (c && Date.now() - c.at < CACHE_MS) { Object.assign(raw, c.raw); dirty.clear(); }
  } catch { /* caché dañada: se lee de nuevo */ }
}
loadCache();
let current: Dataset | null = null;
let lastError: string | null = null;

const clone = <T,>(v: T): T => structuredClone(v);
const today = () => todayIn(local().settings.timezone);
const touch = (...s: Segment[]) => s.forEach((x) => dirty.add(x));

/* ---------- Lectura ---------- */

async function fetchSegment(s: Segment): Promise<void> {
  const t = today();
  if (s === 'properties') raw.properties = await beds24.list<B24Property>('/properties', { includeAllRooms: true });
  if (s === 'bookings') {
    raw.bookings = await beds24.list<B24Booking>('/bookings', {
      departureFrom: addDays(t, -HISTORY_DAYS), status: BOOKING_STATUSES, includeInvoiceItems: true, includeInfoItems: true,
    });
  }
  if (s === 'calendar') {
    const rooms = raw.properties.flatMap((p) => (p.roomTypes ?? []).map((r) => r.id));
    raw.calendar = rooms.length
      ? await beds24.list<B24RoomCalendar>('/inventory/rooms/calendar', { roomId: rooms, startDate: addDays(t, -30), endDate: addDays(t, FUTURE_DAYS), includePrices: true, includeMinStay: true, includeOverride: true })
      : [];
  }
  if (s === 'messages') raw.messages = await beds24.list<B24Message>('/bookings/messages', { maxAge: 365 });
}

const SCOPE: Record<Segment, 'reservations' | 'availability' | 'rates' | 'messages'> = { properties: 'availability', bookings: 'reservations', calendar: 'rates', messages: 'messages' };
const LABEL: Record<Segment, string> = { properties: 'Departamentos', bookings: 'Reservas y bloqueos', calendar: 'Precios y disponibilidad', messages: 'Mensajes' };

async function refreshDirty(): Promise<void> {
  // Los departamentos van primero: el calendario necesita sus habitaciones.
  const order = ALL.filter((s) => dirty.has(s));
  if (order.includes('properties')) { order.splice(order.indexOf('properties'), 1); order.unshift('properties'); }
  for (const s of order) {
    try {
      await fetchSegment(s);
      dirty.delete(s);
      const count = s === 'properties' ? raw.properties.length : s === 'bookings' ? raw.bookings.length : s === 'calendar' ? raw.calendar.length : raw.messages.length;
      logSync({ scope: SCOPE[s], result: 'ok', detail: `${LABEL[s]}: ${count} registros leídos` });
      lastError = null;
    } catch (e) {
      if (e instanceof AuthError) throw e;
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      logSync({ scope: SCOPE[s], result: 'error', detail: `${LABEL[s]}: ${msg}` });
      lastError = msg;
      // Sin mensajes el panel sigue funcionando; sin el resto, no.
      if (s !== 'messages') throw e;
    }
  }
  saveCache();
  current = assemble();
}

function assemble(): Dataset {
  const L = local();
  const t = today();
  const properties = propertiesFrom(raw.properties, L.propertyProfiles);
  const byRoom = new Map(properties.map((p) => [Number(p.external.beds24RoomId), p]));

  const reservations: Reservation[] = [];
  const blocks: CalendarBlock[] = [];
  const payments: Payment[] = [];
  const guests = new Map<ID, Guest>();
  const bookingIndex = new Map<number, { reservation: Reservation }>();

  const sorted = [...raw.bookings].sort((a, b) => (a.bookingTime ?? '').localeCompare(b.bookingTime ?? ''));
  for (const b of sorted) {
    const p = byRoom.get(b.roomId);
    if (!p) continue;
    if (b.status === 'black') { blocks.push(blockFrom(b, p.id)); continue; }
    const r = reservationFrom(b, p.id, p.currency, t);
    reservations.push(r);
    bookingIndex.set(b.id, { reservation: r });
    payments.push(...paymentsFrom(b, p.currency));
    const g = guestFromBooking(b);
    const prev = guests.get(g.id);
    const prof = L.guestProfiles[g.id];
    guests.set(g.id, { ...g, createdAt: prev?.createdAt ?? g.createdAt, notes: prof?.notes ?? '', preferences: prof?.preferences ?? [], document: prof?.document });
  }
  for (const pg of L.pendingGuests) if (!guests.has(pg.id)) guests.set(pg.id, pg);
  // Los huéspedes pendientes que ya tienen reserva dejan de ser pendientes.
  const before = L.pendingGuests.length;
  L.pendingGuests = L.pendingGuests.filter((g) => !reservations.some((r) => r.guestId === g.id));
  if (L.pendingGuests.length !== before) saveLocal();

  blocks.push(...blackoutsFrom(raw.calendar).filter((b) => byRoom.has(b2room(b.propertyId))));
  reservations.sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const ds: Dataset = {
    properties,
    guests: [...guests.values()],
    reservations,
    payments,
    expenses: L.expenses,
    blocks,
    rates: ratesFrom(raw.calendar),
    seasons: [],
    tasks: L.tasks,
    conversations: conversationsFrom(raw.messages, bookingIndex),
    templates: L.templates,
    channels: channels(reservations),
    sync: syncStatus(),
    settings: L.settings,
  };
  syncCleaningTasks(ds, t);
  L.tasks = ds.tasks;
  saveLocal();
  return ds;
}

const b2room = (propertyId: ID): number => Number(propertyId.replace('prop_b24_', ''));

function channels(reservations: Reservation[]): Channel[] {
  const L = local();
  const n = (c: Reservation['channel']) => reservations.filter((r) => r.channel === c).length;
  return [
    { id: 'beds24', name: 'Beds24', description: `Conectado. Fuente de verdad de departamentos, reservas, disponibilidad, precios y mensajes. ${raw.properties.length} alojamientos en la cuenta.`, status: lastError ? 'error' : 'connected', lastSyncAt: L.lastSyncAt },
    { id: 'airbnb', name: 'Airbnb', description: n('airbnb') ? `${n('airbnb')} reservas recibidas desde Airbnb a través de Beds24.` : 'Todavía no hay reservas de Airbnb. La conexión con Airbnb se hace dentro de Beds24 (Canales → Airbnb).', status: n('airbnb') ? 'active' : 'pending_config' },
    { id: 'booking', name: 'Booking.com', description: n('booking') ? `${n('booking')} reservas recibidas desde Booking.com a través de Beds24.` : 'Todavía no hay reservas de Booking.com. La conexión se hace dentro de Beds24 (Canales → Booking.com).', status: n('booking') ? 'active' : 'pending_config' },
    { id: 'web', name: 'Página web', description: 'El sitio todavía deriva las consultas a WhatsApp. Las reservas directas online llegarán con el motor de reservas de Beds24.', status: n('web') ? 'active' : 'pending_integration' },
    { id: 'manual', name: 'Reservas manuales', description: 'Las reservas y bloqueos que cargás en el panel se guardan directamente en Beds24.', status: 'active' },
  ];
}

function syncStatus(): SyncStatus[] {
  const L = local();
  const log = L.syncLog;
  return [{ channelId: 'beds24', state: lastError ? 'error' : log.length ? 'idle' : 'never', lastSyncAt: L.lastSyncAt, log: log.filter((x) => x.result === 'ok'), errors: log.filter((x) => x.result === 'error') }];
}

async function ds(): Promise<Dataset> {
  if (dirty.size) await refreshDirty();
  else if (!current) current = assemble();
  return current!;
}

/* ---------- Escritura ---------- */

const need = <T,>(v: T | undefined, what: string): T => {
  if (v === undefined) throw new DomainError(`No se encontró ${what}.`);
  return v;
};
const rawBooking = (reservationId: ID) => need(raw.bookings.find((b) => b.id === b24Number(reservationId)), 'la reserva en Beds24');
const roomOf = (d: Dataset, propertyId: ID) => Number(need(d.properties.find((p) => p.id === propertyId), 'el departamento').external.beds24RoomId);

function assertEditable(r: Reservation): void {
  if (liveServices.policy.lockedChannels.includes(r.channel)) {
    throw new DomainError(`Esta reserva llegó desde ${r.channel === 'airbnb' ? 'Airbnb' : 'Booking.com'}: las fechas, el estado y el importe se cambian en ese canal, y Beds24 los actualiza solo.`);
  }
}

async function after<T>(segments: Segment[], value: T): Promise<T> {
  touch(...segments);
  await refreshDirty();
  return value;
}


export const liveServices: Services = {
  mode: 'live',
  policy: {
    lockedChannels: ['airbnb', 'booking'],
    creatableChannels: ['manual'],
    messagesAreReal: true,
    seasonalPricing: false,
    localPropertyFields: LOCAL_PROPERTY_FIELDS,
    localModules: ['gastos', 'tareas', 'configuración', 'plantillas', 'notas y preferencias de huéspedes', 'fotos y comodidades'],
    sourceName: 'Beds24',
  },

  refresh: async () => { touch(...ALL); await refreshDirty(); },
  /** Al cerrar sesión se borra la copia de los datos guardada en la pestaña. */
  clearCache: () => { try { sessionStorage.removeItem(CACHE_KEY); } catch { /* nada */ } touch(...ALL); current = null; },

  snapshot: async () => clone(await ds()),

  reservations: {
    list: async () => clone((await ds()).reservations),
    create: async (input: NewReservation) => {
      const d = await ds();
      validateStay(d, input);
      const guest = need(d.guests.find((g) => g.id === input.guestId), 'el huésped');
      const res = await beds24.write('/bookings', [{
        roomId: roomOf(d, input.propertyId),
        status: b24StatusOf(input.status),
        arrival: input.checkIn,
        departure: input.checkOut,
        numAdult: input.adults,
        numChild: input.children,
        ...bookingGuestFields(guest),
        notes: input.observations,
        price: totalOf(input.breakdown),
        commission: input.breakdown.channelFee,
        invoiceItems: chargesFor(input.breakdown),
        actions: { checkAvailability: true },
      }]);
      const id = Number(res[0]?.new?.id);
      await after(['bookings', 'calendar'], null);
      return clone(need(current!.reservations.find((r) => r.id === ids.reservation(id)), 'la reserva creada'));
    },
    update: async (id: ID, patch: ReservationPatch) => {
      const d = await ds();
      const r = need(d.reservations.find((x) => x.id === id), 'la reserva');
      const next: Reservation = { ...r, ...patch };
      const onlyNotes = Object.keys(patch).every((k) => k === 'observations');
      if (!onlyNotes) assertEditable(r);
      validateStay(d, next, id);
      const b = rawBooking(id);
      const body: Record<string, unknown> = { id: b.id };
      if (next.checkIn !== r.checkIn) body.arrival = next.checkIn;
      if (next.checkOut !== r.checkOut) body.departure = next.checkOut;
      if (next.propertyId !== r.propertyId) body.roomId = roomOf(d, next.propertyId);
      if (next.adults !== r.adults) body.numAdult = next.adults;
      if (next.children !== r.children) body.numChild = next.children;
      if (next.status !== r.status) body.status = b24StatusOf(next.status);
      if (next.observations !== r.observations) body.notes = next.observations;
      if (next.guestId !== r.guestId) Object.assign(body, bookingGuestFields(need(d.guests.find((g) => g.id === next.guestId), 'el huésped')));
      if (JSON.stringify(next.breakdown) !== JSON.stringify(r.breakdown)) {
        const old = (b.invoiceItems ?? []).filter((i) => i.type === 'charge').map((i) => ({ id: i.id }));
        body.price = totalOf(next.breakdown);
        body.commission = next.breakdown.channelFee;
        body.invoiceItems = [...old, ...chargesFor(next.breakdown)];
      }
      if (Object.keys(body).length > 1) await beds24.write('/bookings', [body]);
      await after(['bookings', 'calendar'], null);
      return clone(need(current!.reservations.find((x) => x.id === id), 'la reserva'));
    },
    cancel: async (id: ID) => {
      const d = await ds();
      const r = need(d.reservations.find((x) => x.id === id), 'la reserva');
      assertEditable(r);
      await beds24.write('/bookings', [{ id: b24Number(id), status: 'cancelled' }]);
      await after(['bookings', 'calendar'], null);
      return clone(need(current!.reservations.find((x) => x.id === id), 'la reserva'));
    },
    remove: async (id: ID) => {
      const d = await ds();
      const r = need(d.reservations.find((x) => x.id === id), 'la reserva');
      assertEditable(r);
      // Beds24 no borra reservas activas: primero se cancela.
      if (r.status !== 'cancelled') await beds24.write('/bookings', [{ id: b24Number(id), status: 'cancelled' }]);
      await beds24.remove('/bookings', [b24Number(id)]);
      await after(['bookings', 'calendar', 'messages'], undefined);
    },
    addNote: async (id: ID, text: string, author: string) => {
      if (!text.trim()) throw new DomainError('Escribí la nota.');
      await beds24.write('/bookings', [{ id: b24Number(id), infoItems: [{ code: NOTE_CODE, text: `[${author}] ${text.trim()}` }] }]);
      await after(['bookings'], null);
      const notes = need(current!.reservations.find((x) => x.id === id), 'la reserva').notes;
      return clone(notes[notes.length - 1] ?? ({ id: uid('note'), at: new Date().toISOString(), author, text } as Note));
    },
    removeNote: async (id: ID, noteId: ID) => {
      await beds24.write('/bookings', [{ id: b24Number(id), infoItems: [{ id: b24Number(noteId) }] }]);
      await after(['bookings'], undefined);
    },
  },

  payments: {
    list: async () => clone((await ds()).payments),
    create: async (input) => {
      const d = await ds();
      const r = need(d.reservations.find((x) => x.id === input.reservationId), 'la reserva');
      if (!(input.amount > 0)) throw new DomainError('El importe tiene que ser mayor a cero.');
      if (!isValidDate(input.date)) throw new DomainError('La fecha del pago no es válida.');
      if (input.currency !== r.currency) throw new DomainError(`El pago tiene que estar en ${r.currency}, la moneda de la reserva.`);
      const balance = totalOf(r.breakdown) - paidOf(r.id, d.payments);
      if (input.amount > balance + 0.005) throw new DomainError(`El importe supera el saldo pendiente (${money(balance, r.currency)}).`);
      const description = paymentDescription(input.method, input.note, input.date !== today() ? input.date : undefined);
      await beds24.write('/bookings', [{ id: b24Number(r.id), invoiceItems: [{ type: 'payment', qty: 1, amount: input.amount, description }] }]);
      await after(['bookings'], null);
      const mine = current!.payments.filter((p) => p.reservationId === r.id);
      return clone(mine[mine.length - 1]);
    },
    remove: async (id: ID) => {
      const d = await ds();
      const p = need(d.payments.find((x) => x.id === id), 'el pago');
      await beds24.write('/bookings', [{ id: b24Number(p.reservationId), invoiceItems: [{ id: b24Number(id) }] }]);
      await after(['bookings'], undefined);
    },
  },

  properties: {
    list: async () => clone((await ds()).properties),
    create: async (input) => {
      if (!input.internalName.trim()) throw new DomainError('El departamento necesita un nombre.');
      const res = await beds24.write('/properties', [{
        name: input.internalName.trim(), propertyType: 'apartment', currency: input.currency, address: input.address, city: input.city, state: 'Mendoza', country: 'AR',
        checkInStart: input.checkInTime, checkOutEnd: input.checkOutTime,
        roomTypes: [{ name: input.internalName.trim(), qty: 1, maxPeople: input.capacity, maxAdult: input.capacity, minStay: input.minStay, maxStay: input.maxStay }],
      }]);
      const roomId = Number((res[0]?.new?.roomTypes as { id: number }[] | undefined)?.[0]?.id);
      if (roomId) {
        // Las habitaciones nuevas empiezan sin unidades disponibles: se abren hasta dentro de dos años.
        const t = today();
        await beds24.write('/inventory/rooms/calendar', [{ roomId, calendar: [{ from: t, to: addDays(t, 730), numAvail: 1, ...(input.basePrice > 0 ? { price1: input.basePrice } : {}) }] }]);
        const L = local();
        L.propertyProfiles[ids.property(roomId)] = { photos: input.photos, amenities: input.amenities, bedrooms: input.bedrooms, beds: input.beds, bathrooms: input.bathrooms, basePrice: input.basePrice, publicName: input.publicName, description: input.description };
        saveLocal();
      }
      await after(['properties', 'calendar'], null);
      return clone(need(current!.properties.find((p) => p.id === ids.property(roomId)), 'el departamento creado'));
    },
    update: async (id: ID, patch) => {
      const d = await ds();
      const p = need(d.properties.find((x) => x.id === id), 'el departamento');
      const next = { ...p, ...patch };
      if (!next.internalName.trim()) throw new DomainError('El departamento necesita un nombre.');
      if (next.capacity < 1) throw new DomainError('La capacidad tiene que ser al menos 1.');
      if (next.minStay < 1 || next.maxStay < next.minStay) throw new DomainError('Revisá la estadía mínima y máxima.');
      for (const t of [next.checkInTime, next.checkOutTime]) if (!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(t)) throw new DomainError('Beds24 acepta horarios en tramos de 15 minutos (por ejemplo 14:00 o 10:30).');

      const propBody: Record<string, unknown> = {};
      const roomBody: Record<string, unknown> = {};
      const owner = raw.properties.find((x) => String(x.id) === p.external.beds24PropertyId);
      const single = (owner?.roomTypes?.length ?? 1) === 1;
      if (next.internalName !== p.internalName && single) { propBody.name = next.internalName; roomBody.name = next.internalName; }
      if (next.address !== p.address) propBody.address = next.address;
      if (next.city !== p.city) propBody.city = next.city;
      if (next.currency !== p.currency) propBody.currency = next.currency;
      if (next.checkInTime !== p.checkInTime) propBody.checkInStart = next.checkInTime;
      if (next.checkOutTime !== p.checkOutTime) propBody.checkOutEnd = next.checkOutTime;
      if (next.capacity !== p.capacity) { roomBody.maxPeople = next.capacity; roomBody.maxAdult = next.capacity; }
      if (next.minStay !== p.minStay) roomBody.minStay = next.minStay;
      if (next.maxStay !== p.maxStay) roomBody.maxStay = next.maxStay;
      if (next.cleaningFee !== p.cleaningFee) roomBody.cleaningFee = next.cleaningFee;
      if (Object.keys(propBody).length || Object.keys(roomBody).length) {
        await beds24.write('/properties', [{ id: Number(p.external.beds24PropertyId), ...propBody, ...(Object.keys(roomBody).length ? { roomTypes: [{ id: Number(p.external.beds24RoomId), ...roomBody }] } : {}) }]);
        touch('properties');
      }

      const L = local();
      const prof: PropertyProfile = { ...L.propertyProfiles[id] };
      for (const k of LOCAL_PROPERTY_FIELDS) if (k in patch) (prof as Record<string, unknown>)[k] = next[k];
      L.propertyProfiles[id] = prof;
      saveLocal();
      await after([], null);
      return clone(need(assembleAndFind(id), 'el departamento'));
    },
  },

  availability: {
    listBlocks: async () => clone((await ds()).blocks),
    createBlock: async (input) => {
      const d = await ds();
      validateBlock(d, input);
      await beds24.write('/bookings', [{
        roomId: roomOf(d, input.propertyId), status: 'black', arrival: input.start, departure: input.end,
        firstName: 'Bloqueo', lastName: input.reason || BLOCK_TYPE[input.type], notes: input.reason, custom10: input.type, actions: { checkAvailability: true },
      }]);
      await after(['bookings', 'calendar'], null);
      return clone(current!.blocks.find((b) => b.propertyId === input.propertyId && b.start === input.start) ?? { ...input, id: uid('blk') });
    },
    updateBlock: async (id: ID, patch) => {
      const d = await ds();
      const b = need(d.blocks.find((x) => x.id === id), 'el bloqueo');
      const next = { ...b, ...patch };
      validateBlock(d, next, id);
      if (isCalendarBlock(id)) {
        const room = roomOf(d, b.propertyId);
        await beds24.write('/inventory/rooms/calendar', [{ roomId: room, calendar: [{ from: b.start, to: addDays(b.end, -1), override: 'none' }] }, { roomId: roomOf(d, next.propertyId), calendar: [{ from: next.start, to: addDays(next.end, -1), override: 'blackout' }] }]);
        await after(['calendar'], null);
      } else {
        await beds24.write('/bookings', [{ id: b24Number(id), roomId: roomOf(d, next.propertyId), arrival: next.start, departure: next.end, notes: next.reason, lastName: next.reason || BLOCK_TYPE[next.type], custom10: next.type }]);
        await after(['bookings', 'calendar'], null);
      }
      return clone(current!.blocks.find((x) => x.propertyId === next.propertyId && x.start === next.start) ?? next);
    },
    removeBlock: async (id: ID) => {
      const d = await ds();
      const b = need(d.blocks.find((x) => x.id === id), 'el bloqueo');
      if (isCalendarBlock(id)) {
        await beds24.write('/inventory/rooms/calendar', [{ roomId: roomOf(d, b.propertyId), calendar: [{ from: b.start, to: addDays(b.end, -1), override: 'none' }] }]);
        await after(['calendar'], undefined);
      } else {
        await beds24.remove('/bookings', [b24Number(id)]);
        await after(['bookings', 'calendar'], undefined);
      }
    },
  },

  pricing: {
    listRates: async () => clone((await ds()).rates),
    applyRates: async (change: RateChange) => {
      const d = await ds();
      if (change.end <= change.start) throw new DomainError('Elegí al menos una noche.');
      if (change.price != null && !(change.price > 0)) throw new DomainError('El precio tiene que ser mayor a cero.');
      if (change.minStay != null && change.minStay < 1) throw new DomainError('La estadía mínima tiene que ser al menos 1 noche.');
      const days = eachDay(change.start, change.end).filter((x) => !change.weekdays?.length || change.weekdays.includes(weekday(x)));
      if (!days.length) throw new DomainError('Ninguna noche del rango coincide con los días elegidos.');
      const body = change.propertyIds.map((pid) => {
        const p = need(d.properties.find((x) => x.id === pid), 'el departamento');
        const values: Record<string, number | null> = {};
        if (change.price !== undefined) values.price1 = change.price;
        // "Volver al heredado" en estadía mínima = la estadía mínima de la habitación.
        if (change.minStay !== undefined) values.minStay = change.minStay ?? p.minStay;
        return { roomId: Number(p.external.beds24RoomId), calendar: toRanges(days).map((r) => ({ ...r, ...values })) };
      });
      await beds24.write('/inventory/rooms/calendar', body);
      await after(['calendar'], undefined);
    },
    listSeasons: async () => [],
    saveSeason: async () => { throw new DomainError('Con Beds24 conectado, los precios por temporada se cargan como precios por fecha (Edición masiva).'); },
    removeSeason: async () => { throw new DomainError('Con Beds24 conectado no hay temporadas automáticas.'); },
  },

  guests: {
    list: async () => clone((await ds()).guests),
    create: async (input) => {
      if (!input.firstName.trim()) throw new DomainError('El huésped necesita un nombre.');
      const d = await ds();
      const id = guestIdFor({ ...input, mobile: input.phone });
      const existing = d.guests.find((g) => g.id === id);
      if (existing) return clone(existing);
      const g: Guest = { ...input, id, createdAt: new Date().toISOString() };
      const L = local();
      L.pendingGuests.push(g);
      if (input.notes || input.preferences.length || input.document) L.guestProfiles[id] = { notes: input.notes, preferences: input.preferences, document: input.document };
      saveLocal();
      current = assemble();
      return clone(g);
    },
    update: async (id: ID, patch) => {
      const d = await ds();
      const g = need(d.guests.find((x) => x.id === id), 'el huésped');
      const next = { ...g, ...patch };
      if (!next.firstName.trim()) throw new DomainError('El huésped necesita un nombre.');
      const L = local();
      const newId = guestIdFor({ ...next, mobile: next.phone });
      L.guestProfiles[newId] = { notes: next.notes, preferences: next.preferences, document: next.document };
      if (newId !== id) delete L.guestProfiles[id];
      const pending = L.pendingGuests.findIndex((x) => x.id === id);
      if (pending >= 0) L.pendingGuests[pending] = { ...next, id: newId };
      saveLocal();
      const contactChanged = (['firstName', 'lastName', 'email', 'phone', 'country'] as const).some((k) => next[k] !== g[k]);
      const bookings = raw.bookings.filter((b) => b.status !== 'black' && guestIdFor(b) === id);
      if (contactChanged && bookings.length) {
        await beds24.write('/bookings', bookings.map((b) => ({ id: b.id, ...bookingGuestFields(next) })));
        touch('bookings');
      }
      await after([], null);
      current = assemble();
      return clone(need(current.guests.find((x) => x.id === newId) ?? current.guests.find((x) => x.id === id), 'el huésped'));
    },
  },

  messaging: {
    listConversations: async () => clone((await ds()).conversations),
    listTemplates: async () => clone(local().templates),
    send: async (conversationId: ID, text: string) => {
      if (!text.trim()) throw new DomainError('Escribí un mensaje.');
      await beds24.write('/bookings/messages', [{ bookingId: b24Number(conversationId), message: text.trim() }]);
      await after(['messages'], null);
      const c = current!.conversations.find((x) => x.id === conversationId);
      return clone(c?.messages[c.messages.length - 1] ?? ({ id: uid('msg'), at: new Date().toISOString(), from: 'host', text } as Message));
    },
    markRead: async (conversationId: ID, read: boolean) => {
      const bookingId = b24Number(conversationId);
      const guestMsgs = raw.messages.filter((m) => m.bookingId === bookingId && m.source === 'guest');
      const targets = read ? guestMsgs.filter((m) => m.read === false) : guestMsgs.slice(-1);
      if (!targets.length) return;
      await beds24.write('/bookings/messages', targets.map((m) => ({ id: m.id, read })));
      await after(['messages'], undefined);
    },
    saveTemplate: async (t) => {
      if (!t.name.trim() || !t.text.trim()) throw new DomainError('La plantilla necesita nombre y texto.');
      const L = local();
      const tpl: MessageTemplate = { ...t, id: t.id ?? uid('tpl') };
      const i = L.templates.findIndex((x) => x.id === tpl.id);
      if (i >= 0) L.templates[i] = tpl; else L.templates.push(tpl);
      saveLocal();
      current = assemble();
      return clone(tpl);
    },
    removeTemplate: async (id: ID) => {
      const L = local();
      L.templates = L.templates.filter((t) => t.id !== id);
      saveLocal();
      current = assemble();
    },
  },

  expenses: {
    list: async () => clone(local().expenses),
    save: async (e) => {
      if (!(e.amount > 0)) throw new DomainError('El importe tiene que ser mayor a cero.');
      if (!isValidDate(e.date)) throw new DomainError('La fecha no es válida.');
      if (!e.description.trim()) throw new DomainError('Agregá una descripción.');
      const L = local();
      const exp: Expense = { ...e, id: e.id ?? uid('exp') };
      const i = L.expenses.findIndex((x) => x.id === exp.id);
      if (i >= 0) L.expenses[i] = exp; else L.expenses.push(exp);
      saveLocal();
      current = assemble();
      return clone(exp);
    },
    remove: async (id: ID) => {
      const L = local();
      L.expenses = L.expenses.filter((e) => e.id !== id);
      saveLocal();
      current = assemble();
    },
  },

  tasks: {
    list: async () => clone((await ds()).tasks),
    save: async (t) => {
      const d = await ds();
      if (!d.properties.some((p) => p.id === t.propertyId)) throw new DomainError('Elegí un departamento.');
      if (!isValidDate(t.date)) throw new DomainError('La fecha no es válida.');
      const L = local();
      const task: Task = { ...t, id: t.id ?? uid('tsk') };
      const i = L.tasks.findIndex((x) => x.id === task.id);
      if (i >= 0) L.tasks[i] = task; else L.tasks.push(task);
      saveLocal();
      current = assemble();
      return clone(task);
    },
    remove: async (id: ID) => {
      const d = await ds();
      const L = local();
      const t = L.tasks.find((x) => x.id === id);
      const linked = t?.reservationId && d.reservations.some((r) => r.id === t.reservationId && isActive(r));
      if (t && linked) t.status = 'done';
      else L.tasks = L.tasks.filter((x) => x.id !== id);
      saveLocal();
      current = assemble();
    },
  },

  channels: {
    list: async () => clone((await ds()).channels),
    syncStatus: async () => clone(syncStatus()),
  },

  settings: {
    get: async () => clone(local().settings),
    update: async (patch: Partial<Settings>) => {
      const L = local();
      const next = { ...L.settings, ...patch };
      if (!(next.currency.demoRate > 0)) throw new DomainError('El tipo de cambio tiene que ser mayor a cero.');
      L.settings = next;
      saveLocal();
      current = assemble();
      return clone(next);
    },
  },
};

function assembleAndFind(id: ID): Property | undefined {
  current = assemble();
  return current.properties.find((p) => p.id === id);
}

/** Para pruebas: carga datos crudos sin red. */
export function __setRawForTests(r: Partial<typeof raw>): Dataset {
  Object.assign(raw, r);
  dirty.clear();
  current = assemble();
  return current;
}

