import { useState } from 'react';
import { Building2, CalendarDays } from 'lucide-react';
import type { ChannelId, PaymentStatus, Property, ReservationStatus } from '@/types';
import { BLOCK_COLOR, CHANNEL, PAY_STATUS, RES_STATUS } from '@/lib/labels';
import { addDays, addMonths, endOfMonthExclusive, isValidDate, startOfMonth, type DateRange } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { Badge, Input, Select } from './primitives';

export function ChannelBadge({ channel, className }: { channel: ChannelId; className?: string }) {
  const c = CHANNEL[channel];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap', className)} style={{ background: c.soft, color: c.text }}>
      <span className="size-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

export const StatusBadge = ({ status }: { status: ReservationStatus }) => <Badge tone={RES_STATUS[status].tone} dot>{RES_STATUS[status].label}</Badge>;
export const PayBadge = ({ status }: { status: PaymentStatus }) => <Badge tone={PAY_STATUS[status].tone}>{PAY_STATUS[status].label}</Badge>;

export function ChannelLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted', className)}>
      {(Object.keys(CHANNEL) as ChannelId[]).map((id) => (
        <li key={id} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: CHANNEL[id].color }} />{CHANNEL[id].label}</li>
      ))}
      <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: BLOCK_COLOR.color }} />Bloqueo</li>
      <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-soft" />Pendiente de confirmar</li>
    </ul>
  );
}

/** Foto del departamento, con un reemplazo neutro si no tiene o no carga. */
export function PropertyPhoto({ property, className, size = 'sm' }: { property: Property | undefined; className?: string; size?: 'sm' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const src = property?.photos[0];
  const thumb = size === 'sm' && src ? src.replace('/img/apts/', '/img/sm/apts/') : src;
  if (!src || failed) {
    return (
      <span className={cn('flex items-center justify-center bg-sand text-accent/50', className)} aria-hidden>
        <Building2 className={size === 'sm' ? 'size-4' : 'size-8'} />
      </span>
    );
  }
  return <img src={thumb} alt="" loading="lazy" onError={() => setFailed(true)} className={cn('bg-sand object-cover', className)} />;
}

export type PresetId = 'this_month' | 'last_month' | 'next_month' | 'last_30' | 'next_30' | 'last_90' | 'year' | 'last_12' | 'custom';

const PRESETS: { id: PresetId; label: string; range: (today: string) => DateRange }[] = [
  { id: 'this_month', label: 'Este mes', range: (t) => ({ start: startOfMonth(t), end: endOfMonthExclusive(t) }) },
  { id: 'last_month', label: 'Mes pasado', range: (t) => ({ start: addMonths(startOfMonth(t), -1), end: startOfMonth(t) }) },
  { id: 'next_month', label: 'Mes próximo', range: (t) => ({ start: endOfMonthExclusive(t), end: addMonths(endOfMonthExclusive(t), 1) }) },
  { id: 'last_30', label: 'Últimos 30 días', range: (t) => ({ start: addDays(t, -29), end: addDays(t, 1) }) },
  { id: 'next_30', label: 'Próximos 30 días', range: (t) => ({ start: t, end: addDays(t, 30) }) },
  { id: 'last_90', label: 'Últimos 90 días', range: (t) => ({ start: addDays(t, -89), end: addDays(t, 1) }) },
  { id: 'last_12', label: 'Últimos 12 meses', range: (t) => ({ start: addMonths(startOfMonth(t), -11), end: endOfMonthExclusive(t) }) },
  { id: 'year', label: 'Este año', range: (t) => ({ start: `${t.slice(0, 4)}-01-01`, end: `${Number(t.slice(0, 4)) + 1}-01-01` }) },
];

export const presetRange = (id: PresetId, today: string): DateRange => (PRESETS.find((p) => p.id === id) ?? PRESETS[0]).range(today);

export interface PeriodValue { preset: PresetId; range: DateRange }

/** Selector de período: atajos + fechas a mano. El "hasta" se muestra inclusivo y se guarda exclusivo. */
export function PeriodPicker({ value, onChange, today, presets }: { value: PeriodValue; onChange: (v: PeriodValue) => void; today: string; presets?: PresetId[] }) {
  const list = PRESETS.filter((p) => !presets || presets.includes(p.id));
  const lastIncl = addDays(value.range.end, -1);
  const set = (start: string, endIncl: string) => {
    if (!isValidDate(start) || !isValidDate(endIncl) || endIncl < start) return;
    onChange({ preset: 'custom', range: { start, end: addDays(endIncl, 1) } });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" />
        <Select aria-label="Período" value={value.preset} onChange={(e) => { const id = e.target.value as PresetId; onChange({ preset: id, range: id === 'custom' ? value.range : presetRange(id, today) }); }} className="w-auto pl-8">
          {list.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          <option value="custom">Personalizado</option>
        </Select>
      </div>
      <div className="flex items-center gap-1.5">
        <Input type="date" aria-label="Desde" value={value.range.start} max={lastIncl} onChange={(e) => set(e.target.value, lastIncl)} className="w-[9.25rem]" />
        <span className="text-xs text-muted">al</span>
        <Input type="date" aria-label="Hasta" value={lastIncl} min={value.range.start} onChange={(e) => set(value.range.start, e.target.value)} className="w-[9.25rem]" />
      </div>
    </div>
  );
}
