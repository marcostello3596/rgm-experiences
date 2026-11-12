import { useMemo, useState } from 'react';
import { BedDouble, CalendarClock, CalendarX, CircleDollarSign, ClipboardList, Download, Moon, Percent, TrendingUp } from 'lucide-react';
import type { ChannelId, Currency } from '@/types';
import { CHANNEL_IDS, CURRENCIES } from '@/types';
import { useStore } from '@/store/useStore';
import { useMetricsSource, useMoneyView, useToday } from '@/store/hooks';
import { byChannel, byProperty, monthlySeries, monthsIn, rangeMetrics } from '@/domain/metrics';
import { fmtView, viewCaption } from '@/domain/money';
import { fmtDate, fmtMonthShort, addDays } from '@/lib/dates';
import { pct, plural } from '@/lib/format';
import { downloadCSV } from '@/lib/csv';
import { CHANNEL } from '@/lib/labels';
import { Button, Card, CardHeader, Kpi, PageHeader, Segmented, Select } from '@/ui/primitives';
import { AreaLine, BarList, BarsChart, Donut } from '@/ui/charts';
import { DataTable, type Column } from '@/ui/DataTable';
import { PeriodPicker, presetRange, type PeriodValue } from '@/ui/domain';

type PropRow = ReturnType<typeof byProperty>[number];
const dec = (n: number) => n.toFixed(1).replace('.', ',');

export default function StatsPage() {
  const { propertyFilter, settings } = useStore();
  const src = useMetricsSource();
  const today = useToday();
  const [currency, setCurrency] = useState<Currency>(settings.currency.reporting);
  const view = useMoneyView(currency);
  const [period, setPeriod] = useState<PeriodValue>(() => ({ preset: 'last_90', range: presetRange('last_90', today) }));
  const [channel, setChannel] = useState<ChannelId | 'all'>('all');

  const filter = useMemo(() => ({ range: period.range, propertyId: propertyFilter, channel }), [period.range, propertyFilter, channel]);
  const m = useMemo(() => rangeMetrics(src, filter, view), [src, filter, view]);
  const months = useMemo(() => monthsIn(period.range).slice(-12), [period.range]);
  const series = useMemo(() => monthlySeries(src, months, { propertyId: propertyFilter, channel }, view), [src, months, propertyFilter, channel, view]);
  const channels = useMemo(() => byChannel(src, { range: period.range, propertyId: propertyFilter }, view), [src, period.range, propertyFilter, view]);
  const props = useMemo(() => byProperty(src, filter, view).filter((p) => p.property.active), [src, filter, view]);
  const fmt = (v: number) => fmtView(v, view);
  const byChannelFilter = channel !== 'all';

  const columns: Column<PropRow>[] = [
    { key: 'name', header: 'Departamento', mobile: 'title', cell: (p) => <span className="font-medium text-ink">{p.property.internalName}</span>, sort: (p) => p.property.internalName },
    { key: 'occ', header: 'Ocupación', align: 'right', cell: (p) => <span className="tnum">{byChannelFilter ? '—' : pct(p.occupancy)}</span>, sort: (p) => p.occupancy },
    { key: 'nights', header: 'Noches', align: 'right', cell: (p) => <span className="tnum">{p.nightsSold}</span>, sort: (p) => p.nightsSold },
    { key: 'bookings', header: 'Reservas', align: 'right', cell: (p) => <span className="tnum">{p.bookings}</span>, sort: (p) => p.bookings },
    { key: 'gross', header: 'Ingresos', align: 'right', cell: (p) => <span className="font-medium text-ink tnum">{fmt(p.gross)}</span>, sort: (p) => p.gross },
    { key: 'adr', header: 'ADR', align: 'right', cell: (p) => <span className="tnum">{fmt(p.adr)}</span>, sort: (p) => p.adr },
    { key: 'revpar', header: 'RevPAR', align: 'right', cell: (p) => <span className="tnum">{byChannelFilter ? '—' : fmt(p.revpar)}</span>, sort: (p) => p.revpar },
    { key: 'stay', header: 'Estadía prom.', align: 'right', cell: (p) => <span className="tnum">{p.bookings ? `${dec(p.avgStay)} n` : '—'}</span>, sort: (p) => p.avgStay },
    { key: 'cancel', header: 'Cancel.', align: 'right', cell: (p) => <span className="tnum">{p.cancellations}</span>, sort: (p) => p.cancellations },
  ];

  const exportCSV = () => downloadCSV('comparativa-departamentos.csv',
    ['Departamento', 'Ocupación %', 'Noches vendidas', 'Noches disponibles', 'Reservas', `Ingresos ${currency}`, `Netos ${currency}`, `ADR ${currency}`, `RevPAR ${currency}`, 'Estadía promedio', 'Anticipación (días)', 'Cancelaciones'],
    props.map((p) => [p.property.internalName, Math.round(p.occupancy * 100), p.nightsSold, p.availableNights, p.bookings, Math.round(p.gross), Math.round(p.net), Math.round(p.adr), Math.round(p.revpar), dec(p.avgStay), Math.round(p.avgLeadDays), p.cancellations]));

  return (
    <>
      <PageHeader
        title="Estadísticas"
        description={<>{fmtDate(period.range.start)} al {fmtDate(addDays(period.range.end, -1))} · {viewCaption(view)}</>}
        actions={<>
          <Segmented value={currency} onChange={setCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          <Select aria-label="Canal" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className="w-44"><option value="all">Todos los canales</option>{CHANNEL_IDS.map((c) => <option key={c} value={c}>{CHANNEL[c].label}</option>)}</Select>
          <PeriodPicker value={period} onChange={setPeriod} today={today} presets={['this_month', 'last_month', 'last_30', 'last_90', 'next_30', 'year', 'last_12']} />
        </>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ocupación" value={byChannelFilter ? '—' : pct(m.occupancy)} icon={Percent} hint={byChannelFilter ? 'No aplica con filtro de canal' : `${m.nightsSold} de ${m.availableNights} noches`} />
        <Kpi label="Ingresos" value={fmt(m.gross)} icon={CircleDollarSign} hint={`Netos ${fmt(m.net)}`} />
        <Kpi label="Tarifa diaria promedio (ADR)" value={fmt(m.adr)} icon={TrendingUp} hint="Alojamiento ÷ noches vendidas" />
        <Kpi label="RevPAR" value={byChannelFilter ? '—' : fmt(m.revpar)} icon={BedDouble} hint="Alojamiento ÷ noches disponibles" />
        <Kpi label="Reservas" value={m.bookings} icon={ClipboardList} hint={plural(m.nightsSold, 'noche vendida', 'noches vendidas')} />
        <Kpi label="Estadía promedio" value={m.bookings ? `${dec(m.avgStay)} noches` : '—'} icon={Moon} hint="Reservas con check-in en el período" />
        <Kpi label="Anticipación promedio" value={m.bookings ? `${Math.round(m.avgLeadDays)} días` : '—'} icon={CalendarClock} hint="Entre la reserva y el check-in" />
        <Kpi label="Cancelaciones" value={m.cancellations} icon={CalendarX} tone={m.cancellations ? 'red' : undefined} hint={`Tasa ${pct(m.cancelRate)}`} />
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Ingresos mensuales" hint={`Brutos y netos · ${currency}`} />
          <BarsChart data={series.map((s) => ({ label: fmtMonthShort(s.key), gross: Math.round(s.gross), net: Math.round(s.net) }))} series={[{ key: 'gross', label: 'Brutos', color: '#3d1a22' }, { key: 'net', label: 'Netos', color: '#c9a37a' }]} format={fmt} />
        </Card>
        <Card>
          <CardHeader title="ADR y RevPAR por mes" hint={currency} />
          <AreaLine data={series.map((s) => ({ label: fmtMonthShort(s.key), adr: Math.round(s.adr), revpar: Math.round(s.revpar) }))} series={[{ key: 'adr', label: 'ADR', color: '#3d1a22' }, { key: 'revpar', label: 'RevPAR', color: '#2f6fd6' }]} format={fmt} />
        </Card>
        <Card>
          <CardHeader title="Ocupación por departamento" hint={byChannelFilter ? 'Noches vendidas por el canal elegido' : 'Noches vendidas ÷ noches disponibles'} />
          <div className="scroll-thin max-h-72 overflow-y-auto pr-1">
            <BarList items={[...props].sort((a, b) => (byChannelFilter ? b.nightsSold - a.nightsSold : b.occupancy - a.occupancy)).map((p) => ({ label: p.property.internalName, value: byChannelFilter ? p.nightsSold : Math.round(p.occupancy * 100), hint: byChannelFilter ? undefined : `${p.nightsSold} n` }))} format={(v) => (byChannelFilter ? `${v} n` : `${v} %`)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Ingresos por canal" hint="Todos los canales, en el período" />
          <Donut data={channels.map((c) => ({ name: CHANNEL[c.channel].label, value: Math.round(c.gross), color: CHANNEL[c.channel].color }))} format={fmt} center={<><span className="text-lg font-semibold text-ink tnum">{channels.reduce((s, c) => s + c.bookings, 0)}</span><span className="text-[11px] text-muted">reservas</span></>} />
        </Card>
      </div>

      <Card padded={false} className="mb-4">
        <CardHeader className="mb-0 px-5 pt-5 pb-4" title="Comparativa entre propiedades" hint="Hacé clic en un encabezado para ordenar" action={<Button size="sm" icon={Download} onClick={exportCSV}>Exportar CSV</Button>} />
        <div className="border-t border-line"><DataTable rows={props} columns={columns} rowKey={(p) => p.property.id} initialSort={{ key: 'gross', dir: 'desc' }} pageSize={20} dense /></div>
      </Card>

      <Card>
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-ink">Cómo se calcula cada indicador</summary>
          <div className="mt-4 grid gap-x-8 gap-y-3 text-[13px] leading-relaxed text-body md:grid-cols-2">
            <p><strong className="text-ink">Estados.</strong> Ocupan el departamento las reservas Confirmadas, Pendientes y Finalizadas. Cuentan como ingreso sólo las Confirmadas y Finalizadas. Las Canceladas sólo aparecen en Cancelaciones.</p>
            <p><strong className="text-ink">Período.</strong> Las noches y los importes de una reserva se reparten parejo entre sus noches y se cuenta la parte que cae dentro del período.</p>
            <p><strong className="text-ink">Ocupación</strong> = noches vendidas ÷ noches disponibles. Disponibles = departamentos activos × días − noches bloqueadas.</p>
            <p><strong className="text-ink">Ingresos brutos</strong> = alojamiento + limpieza − descuentos + impuestos. <strong className="text-ink">Netos</strong> = brutos − comisión del canal (ficticia en la demo).</p>
            <p><strong className="text-ink">ADR</strong> = (alojamiento − descuentos) ÷ noches vendidas con ingreso. <strong className="text-ink">RevPAR</strong> = (alojamiento − descuentos) ÷ noches disponibles.</p>
            <p><strong className="text-ink">Reservas, estadía y anticipación</strong> usan las reservas activas con check-in dentro del período. Anticipación = días entre la creación y el check-in.</p>
            <p><strong className="text-ink">Cancelaciones</strong> = canceladas con check-in en el período. Tasa = canceladas ÷ (activas + canceladas).</p>
            <p><strong className="text-ink">Monedas.</strong> Nunca se suman USD y ARS sin conversión. Si la conversión está apagada, lo que está en la otra moneda queda afuera; si está prendida, se usa el tipo de cambio ficticio.</p>
          </div>
        </details>
      </Card>
    </>
  );
}
