import type { ISODate } from '@/types';

/** Utilidades de fechas sin hora (`YYYY-MM-DD`). Todo el cálculo se hace en UTC para evitar corrimientos por huso horario. */

const DAY = 86_400_000;
export const DEFAULT_TZ = 'America/Argentina/Mendoza';

export const toUTC = (d: ISODate): number => {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
};
export const fromUTC = (ms: number): ISODate => new Date(ms).toISOString().slice(0, 10);

/** Fecha de hoy en la zona horaria del negocio. */
export const today = (tz: string = DEFAULT_TZ): ISODate => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

export const addDays = (d: ISODate, n: number): ISODate => fromUTC(toUTC(d) + n * DAY);
export const diffDays = (a: ISODate, b: ISODate): number => Math.round((toUTC(b) - toUTC(a)) / DAY);
export const nightsBetween = (checkIn: ISODate, checkOut: ISODate): number => Math.max(0, diffDays(checkIn, checkOut));
/** 0 = domingo … 6 = sábado. */
export const weekday = (d: ISODate): number => new Date(toUTC(d)).getUTCDay();
export const isWeekendNight = (d: ISODate): boolean => { const w = weekday(d); return w === 5 || w === 6; };
export const startOfMonth = (d: ISODate): ISODate => d.slice(0, 8) + '01';
export const addMonths = (d: ISODate, n: number): ISODate => {
  const [y, m, day] = d.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return fromUTC(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, last)));
};
/** Primer día del mes siguiente (fin exclusivo del mes). */
export const endOfMonthExclusive = (d: ISODate): ISODate => addMonths(startOfMonth(d), 1);
export const monthKey = (d: ISODate): string => d.slice(0, 7);

export const eachDay = (start: ISODate, endExclusive: ISODate): ISODate[] => {
  const out: ISODate[] = [];
  for (let t = toUTC(start), e = toUTC(endExclusive); t < e; t += DAY) out.push(fromUTC(t));
  return out;
};

/** Rango semiabierto [start, end). */
export interface DateRange { start: ISODate; end: ISODate }

/** Dos rangos semiabiertos se pisan si cada uno empieza antes de que termine el otro. */
export const rangesOverlap = (aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): boolean => aStart < bEnd && bStart < aEnd;

/** Cantidad de noches de [start, end) que caen dentro del rango. */
export const nightsInRange = (start: ISODate, end: ISODate, range: DateRange): number => {
  const s = start > range.start ? start : range.start;
  const e = end < range.end ? end : range.end;
  return Math.max(0, diffDays(s, e));
};

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** dd/MM/yyyy */
export const fmtDate = (d: ISODate | undefined | null): string => {
  if (!d) return '—';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};
/** dd/MM */
export const fmtDayMonth = (d: ISODate): string => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
/** "12 nov" */
export const fmtShort = (d: ISODate): string => `${Number(d.slice(8, 10))} ${MONTHS_SHORT[Number(d.slice(5, 7)) - 1]}`;
/** "noviembre 2026" */
export const fmtMonthYear = (d: ISODate): string => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
/** "nov 26" */
export const fmtMonthShort = (key: string): string => `${MONTHS_SHORT[Number(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}`;
export const weekdayShort = (d: ISODate): string => WEEKDAYS_SHORT[weekday(d)];
/** dd/MM/yyyy HH:mm en la zona horaria indicada. */
export const fmtDateTime = (iso: string, tz: string = DEFAULT_TZ): string => {
  try {
    const p = new Intl.DateTimeFormat('es-AR', { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(iso));
    const g = (t: string) => p.find((x) => x.type === t)?.value ?? '';
    return `${g('day')}/${g('month')}/${g('year')} ${g('hour')}:${g('minute')}`;
  } catch {
    return iso;
  }
};
export const fmtTime = (iso: string, tz: string = DEFAULT_TZ): string => fmtDateTime(iso, tz).slice(11);
export const isValidDate = (d: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(toUTC(d)) && fromUTC(toUTC(d)) === d;
