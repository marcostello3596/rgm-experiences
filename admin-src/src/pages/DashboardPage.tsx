import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, BedDouble, CalendarCheck, CalendarX, ChevronRight, CircleDollarSign, ClipboardList, DoorOpen, Percent, Plus, SprayCan, TrendingUp, Wallet } from 'lucide-react';
import type { Reservation } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookup, useMetricsSource, useMoneyView, useToday } from '@/store/hooks';
import { byChannel, byProperty, lastMonths, monthlySeries, pendingPayments, rangeMetrics } from '@/domain/metrics';
import { fmtView, viewCaption } from '@/domain/money';
import { isActive, nights, paymentStatusOf } from '@/domain/reservations';
import { addDays, diffDays, fmtMonthShort, fmtShort, weekdayShort } from '@/lib/dates';
import { pct, plural } from '@/lib/format';
import { CHANNEL, TASK_STATUS } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { Badge, Button, Card, CardHeader, EmptyState, Kpi, PageHeader, Segmented } from '@/ui/primitives';
import { AreaLine, BarList, BarsChart, Donut } from '@/ui/charts';
import { PayBadge, PeriodPicker, presetRange, type PeriodValue } from '@/ui/domain';
import { useUI } from '@/features/ui-store';

export default function DashboardPage() {
  const { reservations, payments, tasks, propertyFilter, properties } = useStore();
  const src = useMetricsSource();
  const view = useMoneyView();
  const look = useLookup();
  const today = useToday();
  const { openDrawer, newEntry } = useUI();

  const [period, setPeriod] = useState<PeriodValue>(() => ({ preset: 'this_month', range: presetRange('this_month', today) }));
  const [months, setMonths] = useState<6 | 12>(6);
  const [channelMetric, setChannelMetric] = useState<'bookings' | 'gross'>('bookings');
  const [propMetric, setPropMetric] = useState<'gross' | 'occupancy'>('gross');

  const filter = useMemo(() => ({ range: period.range, propertyId: propertyFilter }), [period.range, propertyFilter]);
  const m = useMemo(() => rangeMetrics(src, filter, view), [src, filter, view]);
  const prevRange = useMemo(() => { const len = diffDays(period.range.start, period.range.end); return { start: addDays(period.range.start, -len), end: period.range.start }; }, [period.range]);
  const prev = useMemo(() => rangeMetrics(src, { ...filter, range: prevRange }, view), [src, filter, prevRange, view]);
  const owed = useMemo(() => pendingPayments(src, { propertyId: propertyFilter }, view), [src, propertyFilter, view]);
  const series = useMemo(() => monthlySeries(src, lastMonths(today, months), { propertyId: propertyFilter }, view), [src, today, months, propertyFilter, view]);
  const channels = useMemo(() => byChannel(src, filter, view), [src, filter, view]);
  const props = useMemo(() => byProperty(src, filter, view).filter((p) => p.property.active), [src, filter, view]);

  const { arrivals, departures } = useMemo(() => {
    const limit = addDays(today, 7);
    const scope = reservations.filter((r: Reservation) => isActive(r) && (propertyFilter === 'all' || r.propertyId === propertyFilter));
    return {
      arrivals: scope.filter((r) => r.checkIn >= today && r.checkIn <= limit).sort((x, y) => x.checkIn.localeCompare(y.checkIn)),
      departures: scope.filter((r) => r.checkOut >= today && r.checkOut <= limit).sort((x, y) => x.checkOut.localeCompare(y.checkOut)),
    };
  }, [reservations, today, propertyFilter]);
  const checkInsToday = arrivals.filter((r) => r.checkIn === today).length;
  const checkOutsToday = departures.filter((r) => r.checkOut === today).length;
  const cleaning = tasks.filter((t) => t.type === 'cleaning' && t.status !== 'done' && t.date <= today && (propertyFilter === 'all' || t.propertyId === propertyFilter));
  const cleaningByReservation = useMemo(() => new Map(tasks.filter((t) => t.type === 'cleaning' && t.reservationId).map((t) => [t.reservationId!, t])), [tasks]);

  const money = (v: number) => fmtView(v, view);
  const delta = (now: number, before: number) => {
    if (before <= 0 && now <= 0) return null;
    if (before <= 0) return <span className="text-ok">Nuevo vs. período anterior</span>;
    const d = (now - before) / before;
    const Icon = d >= 0 ? ArrowUpRight : ArrowDownRight;
    return <span className={cn('inline-flex items-center gap-0.5', d >= 0 ? 'text-ok' : 'text-bad')}><Icon className="size-3" />{pct(Math.abs(d))} <span className="text-muted">vs. período anterior</span></span>;
  };
  const when = (d: string) => (d === today ? <Badge tone="wine">Hoy</Badge> : d === addDays(today, 1) ? <span className="text-ink">Mañana</span> : <span className="capitalize">{weekdayShort(d)} {fmtShort(d)}</span>);
  const scope = propertyFilter === 'all' ? `${properties.filter((p) => p.active).length} departamentos activos` : look.propertyName(propertyFilter);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={<>{scope} · {viewCaption(view)}</>}
        actions={<><PeriodPicker value={period} onChange={setPeriod} today={today} presets={['this_month', 'last_month', 'next_month', 'last_30', 'next_30', 'last_90', 'year']} /><Button variant="primary" icon={Plus} onClick={() => newEntry()}>Nueva reserva</Button></>}
      />

      {cleaning.length > 0 && (
        <Link to="/tareas" className="mb-4 flex items-center gap-3 rounded-xl border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn transition hover:brightness-[0.98]">
          <SprayCan className="size-4 shrink-0" />
          <span className="min-w-0 flex-1"><strong className="font-semibold">{plural(cleaning.length, 'limpieza pendiente', 'limpiezas pendientes')}</strong> para hoy o atrasadas: {[...new Set(cleaning.map((t) => look.propertyName(t.propertyId)))].slice(0, 4).join(', ')}{cleaning.length > 4 ? '…' : ''}</span>
          <ChevronRight className="size-4 shrink-0" />
        </Link>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Reservas del período" value={m.bookings} icon={ClipboardList} hint={delta(m.bookings, prev.bookings) ?? 'Con check-in en el período'} to="/reservas" />
        <Kpi label="Ocupación" value={pct(m.occupancy)} icon={Percent} hint={`${m.nightsSold} de ${m.availableNights} noches`} />
        <Kpi label="Ingresos brutos" value={money(m.gross)} icon={CircleDollarSign} hint={delta(m.gross, prev.gross) ?? 'Sin ingresos en el período'} to="/finanzas" />
        <Kpi label="Ingresos netos" value={money(m.net)} icon={Wallet} hint={`Comisiones ficticias: ${money(m.fees)}`} to="/finanzas" />
        <Kpi label="Tarifa diaria (ADR)" value={money(m.adr)} icon={TrendingUp} hint="Alojamiento ÷ noches vendidas" />
        <Kpi label="RevPAR" value={money(m.revpar)} icon={BedDouble} hint="Alojamiento ÷ noches disponibles" />
        <Kpi label="Check-ins de hoy" value={checkInsToday} icon={CalendarCheck} tone={checkInsToday ? 'green' : undefined} hint={checkInsToday ? 'Ver llegadas más abajo' : 'Sin llegadas hoy'} />
        <Kpi label="Check-outs de hoy" value={checkOutsToday} icon={DoorOpen} tone={checkOutsToday ? 'blue' : undefined} hint={checkOutsToday ? 'Ver salidas más abajo' : 'Sin salidas hoy'} />
        <Kpi label="Pendientes de pago" value={owed.count} icon={CalendarX} tone={owed.count ? 'red' : undefined} hint={owed.count ? `${money(owed.amount)} por cobrar` : 'Todo cobrado'} to="/reservas?pago=pendiente" />
        <Kpi label="Limpiezas pendientes" value={cleaning.length} icon={SprayCan} tone={cleaning.length ? 'amber' : undefined} hint="Para hoy o atrasadas" to="/tareas" />
      </div>
      {m.excludedByCurrency > 0 && <p className="-mt-2 mb-4 text-xs text-muted">{plural(m.excludedByCurrency, 'reserva en otra moneda quedó', 'reservas en otra moneda quedaron')} fuera de los importes. Activá la conversión en Configuración → Moneda para incluirlas.</p>}

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Ingresos mensuales" hint={`Brutos y netos · ${view.currency}`} action={<Segmented size="sm" value={months} onChange={setMonths} options={[{ value: 6, label: '6 meses' }, { value: 12, label: '12 meses' }]} />} />
          <BarsChart data={series.map((s) => ({ label: fmtMonthShort(s.key), gross: Math.round(s.gross), net: Math.round(s.net) }))} series={[{ key: 'gross', label: 'Brutos', color: '#3d1a22' }, { key: 'net', label: 'Netos', color: '#c9a37a' }]} format={money} />
        </Card>
        <Card>
          <CardHeader title="Evolución de ocupación" hint="Noches vendidas ÷ noches disponibles, por mes" />
          <AreaLine data={series.map((s) => ({ label: fmtMonthShort(s.key), occ: Math.round(s.occupancy * 100) }))} series={[{ key: 'occ', label: 'Ocupación', color: '#3d1a22' }]} format={(v) => `${v} %`} domain={[0, 100]} />
        </Card>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Reservas por canal" hint="En el período elegido" action={<Segmented size="sm" value={channelMetric} onChange={setChannelMetric} options={[{ value: 'bookings', label: 'Cantidad' }, { value: 'gross', label: 'Ingresos' }]} />} />
          <Donut
            data={channels.map((c) => ({ name: CHANNEL[c.channel].label, value: channelMetric === 'bookings' ? c.bookings : Math.round(c.gross), color: CHANNEL[c.channel].color }))}
            format={channelMetric === 'bookings' ? (v) => String(v) : money}
            center={<><span className="text-xl font-semibold text-ink tnum">{channelMetric === 'bookings' ? m.bookings : money(m.gross)}</span><span className="text-[11px] text-muted">{channelMetric === 'bookings' ? 'reservas' : 'brutos'}</span></>}
          />
        </Card>
        <Card>
          <CardHeader title="Comparativa de ingresos" hint="Período elegido contra el período anterior de igual duración" />
          <BarsChart height={220} data={[{ label: 'Brutos', prev: Math.round(prev.gross), now: Math.round(m.gross) }, { label: 'Netos', prev: Math.round(prev.net), now: Math.round(m.net) }, { label: 'Alojamiento', prev: Math.round(prev.roomRevenue), now: Math.round(m.roomRevenue) }]} series={[{ key: 'prev', label: 'Período anterior', color: '#d9d5cf' }, { key: 'now', label: 'Período elegido', color: '#3d1a22' }]} format={money} />
        </Card>
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Rendimiento por departamento" hint="En el período elegido" action={<Segmented size="sm" value={propMetric} onChange={setPropMetric} options={[{ value: 'gross', label: 'Ingresos' }, { value: 'occupancy', label: 'Ocupación' }]} />} />
          <div className="scroll-thin max-h-64 overflow-y-auto pr-1">
            <BarList
              items={[...props].sort((a, b) => b[propMetric] - a[propMetric]).map((p) => ({ label: p.property.internalName, value: propMetric === 'gross' ? Math.round(p.gross) : Math.round(p.occupancy * 100), hint: propMetric === 'gross' ? pct(p.occupancy) : undefined }))}
              format={propMetric === 'gross' ? money : (v) => `${v} %`}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card padded={false}>
          <CardHeader title="Próximas llegadas" hint="Hoy y los próximos 7 días" className="mb-0 px-5 pt-5 pb-4" action={<Link to="/calendario" className="text-xs font-medium text-accent hover:underline">Ver calendario</Link>} />
          {arrivals.length === 0 ? <EmptyState icon={CalendarCheck} title="Sin llegadas en los próximos días" className="border-t border-line py-8" /> : (
            <ul className="divide-y divide-line border-t border-line">
              {arrivals.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-xs text-muted">{when(r.checkIn)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink">{look.guestName(r.guestId)}</span><span className="block truncate text-xs text-muted">{look.propertyName(r.propertyId)} · {plural(nights(r), 'noche', 'noches')}</span></span>
                  <PayBadge status={paymentStatusOf(r, payments)} />
                  <Button size="sm" variant="ghost" onClick={() => openDrawer(r.id)}>Ver</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card padded={false}>
          <CardHeader title="Próximas salidas" hint="Hoy y los próximos 7 días" className="mb-0 px-5 pt-5 pb-4" action={<Link to="/tareas" className="text-xs font-medium text-accent hover:underline">Ver limpiezas</Link>} />
          {departures.length === 0 ? <EmptyState icon={DoorOpen} title="Sin salidas en los próximos días" className="border-t border-line py-8" /> : (
            <ul className="divide-y divide-line border-t border-line">
              {departures.slice(0, 8).map((r) => {
                const t = cleaningByReservation.get(r.id);
                return (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    <span className="w-20 shrink-0 text-xs text-muted">{when(r.checkOut)}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink">{look.guestName(r.guestId)}</span><span className="block truncate text-xs text-muted">{look.propertyName(r.propertyId)}</span></span>
                    {t ? <Badge tone={TASK_STATUS[t.status].tone}>Limpieza {TASK_STATUS[t.status].label.toLowerCase()}</Badge> : <Badge>Sin limpieza</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => openDrawer(r.id)}>Ver</Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
