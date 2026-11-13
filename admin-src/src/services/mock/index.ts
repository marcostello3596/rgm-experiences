import type { CalendarBlock, Dataset, Expense, Guest, HistoryEntry, ID, MessageTemplate, Note, Payment, Property, Reservation, Season, Task } from '@/types';
import type { NewReservation, RateChange, ReservationPatch, Services } from '../contracts';
import { eachDay, fmtDate, isValidDate, today, weekday } from '@/lib/dates';
import { uid } from '@/lib/cn';
import { DomainError, isActive, paidOf, totalOf } from '@/domain/reservations';
import { validateBlock, validateStay } from '@/domain/validation';
import { money } from '@/lib/format';
import { delay, loadDb, resetDb, saveDb } from './db';
import { syncCleaningTasks } from '@/domain/tasks';

/**
 * IMPLEMENTACIÓN SIMULADA de los servicios. Todo vive en el navegador (localStorage).
 * Las mismas validaciones (fechas, superposición) deberán existir en el backend real.
 */

const LATENCY = 60;
let cold = true;
const clone = <T,>(v: T): T => structuredClone(v);
const db = (): Dataset => loadDb();
const now = (): string => new Date().toISOString();
const hist = (action: string, detail?: string): HistoryEntry => ({ id: uid('h'), at: now(), action, detail });

async function commit<T>(fn: (ds: Dataset) => T): Promise<T> {
  await delay(LATENCY);
  const ds = db();
  const out = fn(ds);
  syncCleaningTasks(ds, today(ds.settings.timezone));
  saveDb();
  return clone(out);
}
async function read<T>(fn: (ds: Dataset) => T): Promise<T> {
  await delay(LATENCY);
  return clone(fn(db()));
}

const need = <T,>(v: T | undefined, what: string): T => {
  if (v === undefined) throw new DomainError(`No se encontró ${what}.`);
  return v;
};

function nextCode(ds: Dataset): number {
  return ds.reservations.reduce((m, r) => Math.max(m, Number(r.code.replace(/\D/g, '')) || 0), 1000) + 1;
}

export const mockServices: Services = {
  mode: 'demo',
  policy: {
    lockedChannels: [],
    creatableChannels: ['manual', 'web', 'airbnb', 'booking'],
    messagesAreReal: false,
    seasonalPricing: true,
    localPropertyFields: [],
    localModules: [],
    sourceName: 'Demostración',
  },

  reservations: {
    list: () => read((ds) => ds.reservations),
    create: (input: NewReservation) =>
      commit((ds) => {
        validateStay(ds, input);
        const n = nextCode(ds);
        const r: Reservation = { ...input, id: `res_${n}`, code: `RGM-${n}`, notes: [], history: [hist('Reserva creada', 'Cargada desde el panel')], createdAt: input.createdAt ?? now() };
        ds.reservations.push(r);
        return r;
      }),
    update: (id: ID, patch: ReservationPatch) =>
      commit((ds) => {
        const r = need(ds.reservations.find((x) => x.id === id), 'la reserva');
        const next: Reservation = { ...r, ...patch };
        validateStay(ds, next, id);
        const changes: string[] = [];
        if (next.checkIn !== r.checkIn || next.checkOut !== r.checkOut) changes.push(`Fechas: ${fmtDate(next.checkIn)} al ${fmtDate(next.checkOut)}`);
        if (next.propertyId !== r.propertyId) changes.push(`Departamento: ${ds.properties.find((p) => p.id === next.propertyId)?.internalName}`);
        if (next.status !== r.status) changes.push(`Estado: ${next.status}`);
        if (totalOf(next.breakdown) !== totalOf(r.breakdown)) changes.push(`Total: ${money(totalOf(next.breakdown), next.currency)}`);
        if (next.status === 'cancelled' && r.status !== 'cancelled') next.cancelledAt = now();
        if (next.status !== 'cancelled') delete next.cancelledAt;
        next.history = [...r.history, hist('Reserva modificada', changes.join(' · ') || undefined)];
        Object.assign(r, next);
        return r;
      }),
    cancel: (id: ID) =>
      commit((ds) => {
        const r = need(ds.reservations.find((x) => x.id === id), 'la reserva');
        if (r.status === 'cancelled') return r;
        r.status = 'cancelled';
        r.cancelledAt = now();
        r.history.push(hist('Reserva cancelada'));
        return r;
      }),
    remove: (id: ID) =>
      commit((ds) => {
        ds.reservations = ds.reservations.filter((r) => r.id !== id);
        ds.payments = ds.payments.filter((p) => p.reservationId !== id);
        ds.conversations = ds.conversations.map((c) => (c.reservationId === id ? { ...c, reservationId: undefined } : c));
      }),
    addNote: (id: ID, text: string, author: string) =>
      commit((ds) => {
        const r = need(ds.reservations.find((x) => x.id === id), 'la reserva');
        if (!text.trim()) throw new DomainError('Escribí la nota.');
        const note: Note = { id: uid('note'), at: now(), author, text: text.trim() };
        r.notes.push(note);
        return note;
      }),
    removeNote: (id: ID, noteId: ID) =>
      commit((ds) => {
        const r = need(ds.reservations.find((x) => x.id === id), 'la reserva');
        r.notes = r.notes.filter((n) => n.id !== noteId);
      }),
  },

  payments: {
    list: () => read((ds) => ds.payments),
    create: (input: Omit<Payment, 'id'>) =>
      commit((ds) => {
        const r = need(ds.reservations.find((x) => x.id === input.reservationId), 'la reserva');
        if (!(input.amount > 0)) throw new DomainError('El importe tiene que ser mayor a cero.');
        if (!isValidDate(input.date)) throw new DomainError('La fecha del pago no es válida.');
        if (input.currency !== r.currency) throw new DomainError(`El pago tiene que estar en ${r.currency}, la moneda de la reserva.`);
        const balance = totalOf(r.breakdown) - paidOf(r.id, ds.payments);
        if (input.amount > balance + 0.005) throw new DomainError(`El importe supera el saldo pendiente (${money(balance, r.currency)}).`);
        const p: Payment = { ...input, id: uid('pay') };
        ds.payments.push(p);
        r.history.push(hist('Pago registrado', `${money(p.amount, p.currency)} · ${fmtDate(p.date)}`));
        return p;
      }),
    remove: (id: ID) =>
      commit((ds) => {
        const p = ds.payments.find((x) => x.id === id);
        ds.payments = ds.payments.filter((x) => x.id !== id);
        const r = p && ds.reservations.find((x) => x.id === p.reservationId);
        if (p && r) r.history.push(hist('Pago eliminado', money(p.amount, p.currency)));
      }),
  },

  properties: {
    list: () => read((ds) => ds.properties),
    create: (input) =>
      commit((ds) => {
        if (!input.internalName.trim()) throw new DomainError('El departamento necesita un nombre interno.');
        const id = uid('prop');
        const p: Property = { ...input, id, units: [{ id: uid('unit'), propertyId: id, name: 'Unidad única', external: {} }] };
        ds.properties.push(p);
        return p;
      }),
    update: (id: ID, patch) =>
      commit((ds) => {
        const p = need(ds.properties.find((x) => x.id === id), 'el departamento');
        const next = { ...p, ...patch };
        if (!next.internalName.trim()) throw new DomainError('El departamento necesita un nombre interno.');
        if (!(next.basePrice > 0)) throw new DomainError('El precio base tiene que ser mayor a cero.');
        if (next.capacity < 1) throw new DomainError('La capacidad tiene que ser al menos 1.');
        if (next.minStay < 1 || next.maxStay < next.minStay) throw new DomainError('Revisá la estadía mínima y máxima.');
        Object.assign(p, next);
        return p;
      }),
  },

  availability: {
    listBlocks: () => read((ds) => ds.blocks),
    createBlock: (input) =>
      commit((ds) => {
        validateBlock(ds, input);
        const b: CalendarBlock = { ...input, id: uid('blk') };
        ds.blocks.push(b);
        return b;
      }),
    updateBlock: (id: ID, patch) =>
      commit((ds) => {
        const b = need(ds.blocks.find((x) => x.id === id), 'el bloqueo');
        const next = { ...b, ...patch };
        validateBlock(ds, next, id);
        Object.assign(b, next);
        return b;
      }),
    removeBlock: (id: ID) => commit((ds) => { ds.blocks = ds.blocks.filter((b) => b.id !== id); }),
  },

  pricing: {
    listRates: () => read((ds) => ds.rates),
    applyRates: (change: RateChange) =>
      commit((ds) => {
        if (change.end <= change.start) throw new DomainError('Elegí al menos una noche.');
        if (change.price != null && !(change.price > 0)) throw new DomainError('El precio tiene que ser mayor a cero.');
        if (change.minStay != null && change.minStay < 1) throw new DomainError('La estadía mínima tiene que ser al menos 1 noche.');
        const days = eachDay(change.start, change.end).filter((d) => !change.weekdays?.length || change.weekdays.includes(weekday(d)));
        const index = new Map(ds.rates.map((r) => [`${r.propertyId}|${r.date}`, r]));
        for (const propertyId of change.propertyIds) {
          for (const date of days) {
            const key = `${propertyId}|${date}`;
            const rate = index.get(key) ?? { propertyId, date };
            if (change.price !== undefined) { if (change.price === null) delete rate.price; else rate.price = change.price; }
            if (change.minStay !== undefined) { if (change.minStay === null) delete rate.minStay; else rate.minStay = change.minStay; }
            index.set(key, rate);
          }
        }
        ds.rates = [...index.values()].filter((r) => r.price != null || r.minStay != null);
      }),
    listSeasons: () => read((ds) => ds.seasons),
    saveSeason: (season) =>
      commit((ds) => {
        if (!season.name.trim()) throw new DomainError('La temporada necesita un nombre.');
        if (season.end <= season.start) throw new DomainError('La fecha de fin tiene que ser posterior a la de inicio.');
        const s: Season = { ...season, id: season.id ?? uid('sea') };
        const i = ds.seasons.findIndex((x) => x.id === s.id);
        if (i >= 0) ds.seasons[i] = s; else ds.seasons.push(s);
        return s;
      }),
    removeSeason: (id: ID) => commit((ds) => { ds.seasons = ds.seasons.filter((s) => s.id !== id); }),
  },

  guests: {
    list: () => read((ds) => ds.guests),
    create: (input) =>
      commit((ds) => {
        if (!input.firstName.trim()) throw new DomainError('El huésped necesita un nombre.');
        const g: Guest = { ...input, id: uid('gst'), createdAt: now() };
        ds.guests.push(g);
        return g;
      }),
    update: (id: ID, patch) =>
      commit((ds) => {
        const g = need(ds.guests.find((x) => x.id === id), 'el huésped');
        Object.assign(g, patch);
        if (!g.firstName.trim()) throw new DomainError('El huésped necesita un nombre.');
        return g;
      }),
  },

  messaging: {
    listConversations: () => read((ds) => ds.conversations),
    listTemplates: () => read((ds) => ds.templates),
    send: (conversationId: ID, text: string) =>
      commit((ds) => {
        const c = need(ds.conversations.find((x) => x.id === conversationId), 'la conversación');
        if (!text.trim()) throw new DomainError('Escribí un mensaje.');
        const m = { id: uid('msg'), at: now(), from: 'host' as const, text: text.trim(), simulated: true };
        c.messages.push(m);
        c.unread = false;
        return m;
      }),
    markRead: (conversationId: ID, readFlag: boolean) =>
      commit((ds) => {
        const c = ds.conversations.find((x) => x.id === conversationId);
        if (c) c.unread = !readFlag;
      }),
    saveTemplate: (t) =>
      commit((ds) => {
        if (!t.name.trim() || !t.text.trim()) throw new DomainError('La plantilla necesita nombre y texto.');
        const tpl: MessageTemplate = { ...t, id: t.id ?? uid('tpl') };
        const i = ds.templates.findIndex((x) => x.id === tpl.id);
        if (i >= 0) ds.templates[i] = tpl; else ds.templates.push(tpl);
        return tpl;
      }),
    removeTemplate: (id: ID) => commit((ds) => { ds.templates = ds.templates.filter((t) => t.id !== id); }),
  },

  expenses: {
    list: () => read((ds) => ds.expenses),
    save: (e) =>
      commit((ds) => {
        if (!(e.amount > 0)) throw new DomainError('El importe tiene que ser mayor a cero.');
        if (!isValidDate(e.date)) throw new DomainError('La fecha no es válida.');
        if (!e.description.trim()) throw new DomainError('Agregá una descripción.');
        const exp: Expense = { ...e, id: e.id ?? uid('exp') };
        const i = ds.expenses.findIndex((x) => x.id === exp.id);
        if (i >= 0) ds.expenses[i] = exp; else ds.expenses.push(exp);
        return exp;
      }),
    remove: (id: ID) => commit((ds) => { ds.expenses = ds.expenses.filter((e) => e.id !== id); }),
  },

  tasks: {
    list: () => read((ds) => ds.tasks),
    save: (t) =>
      commit((ds) => {
        if (!ds.properties.some((p) => p.id === t.propertyId)) throw new DomainError('Elegí un departamento.');
        if (!isValidDate(t.date)) throw new DomainError('La fecha no es válida.');
        const task: Task = { ...t, id: t.id ?? uid('tsk') };
        const i = ds.tasks.findIndex((x) => x.id === task.id);
        if (i >= 0) ds.tasks[i] = task; else ds.tasks.push(task);
        return task;
      }),
    remove: (id: ID) =>
      commit((ds) => {
        const t = ds.tasks.find((x) => x.id === id);
        // Una limpieza ligada a una reserva activa se volvería a crear sola: se marca como terminada en su lugar.
        const linked = t?.reservationId && ds.reservations.some((r) => r.id === t.reservationId && isActive(r));
        if (t && linked) t.status = 'done';
        else ds.tasks = ds.tasks.filter((x) => x.id !== id);
      }),
  },

  channels: {
    list: () => read((ds) => ds.channels),
    syncStatus: () => read((ds) => ds.sync),
  },

  settings: {
    get: () => read((ds) => ds.settings),
    update: (patch) =>
      commit((ds) => {
        const next = { ...ds.settings, ...patch };
        if (!(next.currency.demoRate > 0)) throw new DomainError('El tipo de cambio tiene que ser mayor a cero.');
        ds.settings = next;
        return ds.settings;
      }),
  },

  resetDemo: async () => {
    await delay(LATENCY);
    resetDb();
  },
  snapshot: async () => {
    // La primera lectura simula la carga inicial desde un servidor; las siguientes son inmediatas.
    await delay(cold ? 450 : 0);
    cold = false;
    return clone(db());
  },
};
