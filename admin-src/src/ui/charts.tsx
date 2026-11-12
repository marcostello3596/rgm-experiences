import type { ReactNode } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/cn';

/** Gráficos con un estilo común. Todos reciben datos ya calculados (domain/metrics). */

export interface Serie { key: string; label: string; color: string }
type Row = Record<string, string | number>;
type Fmt = (v: number) => string;

const AXIS = { tickLine: false, axisLine: false, tickMargin: 8 } as const;
const compact = (v: number): string => (Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.', ',')} M` : Math.abs(v) >= 10_000 ? `${Math.round(v / 1000)} mil` : v.toLocaleString('es-AR', { maximumFractionDigits: 0 }));

interface TipProps { active?: boolean; label?: string | number; payload?: { name?: string; value?: number | string; color?: string; payload?: { fill?: string } }[]; format: Fmt }

function Tip({ active, label, payload, format }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      {label != null && label !== '' && <p className="mb-1 font-semibold text-ink capitalize">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-body">
          <span className="size-2 rounded-sm" style={{ background: p.color ?? p.payload?.fill }} />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto pl-3 font-medium text-ink tnum">{format(Number(p.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

const legend = { iconType: 'circle' as const, iconSize: 8, wrapperStyle: { fontSize: 12, paddingTop: 8 }, itemSorter: null };

export function BarsChart({ data, series, xKey = 'label', format = compact, height = 260, stacked }: { data: Row[]; series: Serie[]; xKey?: string; format?: Fmt; height?: number; stacked?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="#eeebe7" />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis {...AXIS} tickFormatter={compact} width={52} />
        <Tooltip cursor={{ fill: 'rgba(28,24,25,.04)' }} content={<Tip format={format} />} />
        {series.length > 1 && <Legend {...legend} />}
        {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? 'a' : undefined} radius={stacked ? 0 : [4, 4, 0, 0]} maxBarSize={38} isAnimationActive={false} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AreaLine({ data, series, xKey = 'label', format = compact, height = 260, domain }: { data: Row[]; series: Serie[]; xKey?: string; format?: Fmt; height?: number; domain?: [number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="#eeebe7" />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis {...AXIS} tickFormatter={format} width={52} domain={domain} />
        <Tooltip cursor={{ stroke: '#d9d5cf' }} content={<Tip format={format} />} />
        {series.length > 1 && <Legend {...legend} />}
        {series.map((s) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} fill={`url(#g-${s.key})`} dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />)}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface Slice { name: string; value: number; color: string }

export function Donut({ data, format = compact, height = 200, center }: { data: Slice[]; format?: Fmt; height?: number; center?: ReactNode }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const shown = data.filter((d) => d.value > 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={shown.length ? shown : [{ name: 'Sin datos', value: 1, color: '#eeebe7' }]} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={shown.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
              {(shown.length ? shown : [{ color: '#eeebe7' }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            {shown.length > 0 && <Tooltip content={<Tip format={format} />} />}
          </PieChart>
        </ResponsiveContainer>
        {center && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="truncate text-body">{d.name}</span>
            <span className="ml-auto font-medium text-ink tnum">{format(d.value)}</span>
            <span className="w-10 text-right text-xs text-muted tnum">{total > 0 ? Math.round((d.value / total) * 100) : 0} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lista de barras horizontales (ranking). */
export function BarList({ items, format = compact, className }: { items: { label: string; value: number; color?: string; hint?: string; onClick?: () => void }[]; format?: Fmt; className?: string }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((it) => (
        <li key={it.label}>
          <button type="button" onClick={it.onClick} disabled={!it.onClick} className="group block w-full text-left disabled:cursor-default">
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate text-body group-enabled:group-hover:text-ink">{it.label}</span>
              <span className="shrink-0 font-medium text-ink tnum">{format(it.value)}{it.hint && <span className="ml-1.5 font-normal text-muted">{it.hint}</span>}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.05]">
              <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.max(it.value > 0 ? 2 : 0, (Math.abs(it.value) / max) * 100)}%`, background: it.value < 0 ? '#b42335' : it.color ?? '#3d1a22' }} />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
