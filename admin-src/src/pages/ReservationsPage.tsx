import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ban, ClipboardList, CreditCard, Download, Eye, FilterX, MoreHorizontal, Pencil, Plus, Search } from 'lucide-react';
import type { ChannelId, Reservation, ReservationStatus } from '@/types';
import { CHANNEL_IDS, RESERVATION_STATUSES } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookup } from '@/store/hooks';
import { balanceOf, nights, paymentStatusOf, totalOf } from '@/domain/reservations';
import { addDays, fmtDate, rangesOverlap } from '@/lib/dates';
import { matches, money, plural } from '@/lib/format';
import { downloadCSV } from '@/lib/csv';
import { CHANNEL, PAY_STATUS, RES_STATUS } from '@/lib/labels';
import { Button, Card, EmptyState, IconButton, Input, PageHeader, Select } from '@/ui/primitives';
import { DataTable, type Column } from '@/ui/DataTable';
import { MenuItem, Popover } from '@/ui/overlays';
import { ChannelBadge, PayBadge, StatusBadge } from '@/ui/domain';
import { isLocked, useReservationActions } from '@/features/reservation-parts';
import { useUI } from '@/features/ui-store';

type PayFilter = 'all' | 'paid' | 'pending';

export default function ReservationsPage() {
  const { reservations, payments, properties, propertyFilter, setPropertyFilter } = useStore();
  const look = useLookup();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { newEntry, editReservation, openPayment } = useUI();
  const actions = useReservationActions();

  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const status = (params.get('estado') ?? 'all') as ReservationStatus | 'all';
  const channel = (params.get('canal') ?? 'all') as ChannelId | 'all';
  const pay = (params.get('pago') === 'pendiente' ? 'pending' : params.get('pago') === 'pagada' ? 'paid' : 'all') as PayFilter;
  const setParam = (key: string, value: string) => setParams((p) => { if (value === 'all' || !value) p.delete(key); else p.set(key, value); return p; }, { replace: true });

  const rows = useMemo(() => reservations.filter((r) => {
    if (propertyFilter !== 'all' && r.propertyId !== propertyFilter) return false;
    if (status !== 'all' && r.status !== status) return false;
    if (channel !== 'all' && r.channel !== channel) return false;
    if (pay !== 'all') {
      const paid = paymentStatusOf(r, payments) === 'paid';
      if (pay === 'paid' ? !paid : paid || r.status === 'cancelled') return false;
    }
    if ((from || to) && !rangesOverlap(r.checkIn, r.checkOut, from || '0000-01-01', to ? addDays(to, 1) : '9999-12-31')) return false;
    if (q.trim() && !matches(`${r.code} ${look.guestName(r.guestId)} ${look.guest(r.guestId)?.email ?? ''}`, q)) return false;
    return true;
  }), [reservations, payments, propertyFilter, status, channel, pay, from, to, q, look]);

  const filtered = Boolean(q || from || to || status !== 'all' || channel !== 'all' || pay !== 'all' || propertyFilter !== 'all');
  const clear = () => { setQ(''); setFrom(''); setTo(''); setParams({}, { replace: true }); setPropertyFilter('all'); };

  const exportCSV = () => downloadCSV(
    'reservas.csv',
    ['Código', 'Huésped', 'Departamento', 'Canal', 'Check-in', 'Check-out', 'Noches', 'Moneda', 'Alojamiento', 'Limpieza', 'Descuento', 'Impuestos', 'Total', 'Comisión canal', 'Pagado', 'Saldo', 'Estado', 'Estado de pago'],
    rows.map((r) => {
      const total = totalOf(r.breakdown), balance = balanceOf(r, payments);
      return [r.code, look.guestName(r.guestId), look.propertyName(r.propertyId), CHANNEL[r.channel].label, fmtDate(r.checkIn), fmtDate(r.checkOut), nights(r), r.currency, r.breakdown.accommodation, r.breakdown.cleaning, r.breakdown.discount, r.breakdown.taxes, total, r.breakdown.channelFee, total - balance, balance, RES_STATUS[r.status].label, PAY_STATUS[paymentStatusOf(r, payments)].label];
    }),
  );

  const columns: Column<Reservation>[] = [
    { key: 'code', header: 'Código', cell: (r) => <span className="font-medium text-ink tnum">{r.code}</span>, sort: (r) => r.code, mobile: 'hide' },
    { key: 'guest', header: 'Huésped', cell: (r) => <span className="font-medium text-ink">{look.guestName(r.guestId)}<span className="ml-2 text-xs font-normal text-muted md:hidden">{r.code}</span></span>, sort: (r) => look.guestName(r.guestId), mobile: 'title' },
    { key: 'property', header: 'Departamento', cell: (r) => look.propertyName(r.propertyId), sort: (r) => look.propertyName(r.propertyId) },
    { key: 'channel', header: 'Canal', cell: (r) => <ChannelBadge channel={r.channel} />, sort: (r) => r.channel },
    { key: 'in', header: 'Check-in', cell: (r) => <span className="tnum">{fmtDate(r.checkIn)}</span>, sort: (r) => r.checkIn },
    { key: 'out', header: 'Check-out', cell: (r) => <span className="tnum">{fmtDate(r.checkOut)}</span>, sort: (r) => r.checkOut },
    { key: 'nights', header: 'Noches', cell: (r) => <span className="tnum">{nights(r)}</span>, sort: (r) => nights(r), align: 'right', mobile: 'hide' },
    { key: 'amount', header: 'Importe', cell: (r) => <span className="font-medium text-ink tnum">{money(totalOf(r.breakdown), r.currency)}</span>, sort: (r) => totalOf(r.breakdown), align: 'right' },
    { key: 'status', header: 'Estado', cell: (r) => <StatusBadge status={r.status} />, sort: (r) => r.status },
    { key: 'pay', header: 'Pago', cell: (r) => (r.status === 'cancelled' && paymentStatusOf(r, payments) === 'unpaid' ? <span className="text-soft">—</span> : <PayBadge status={paymentStatusOf(r, payments)} />), sort: (r) => paymentStatusOf(r, payments) },
    {
      key: 'actions', header: '', align: 'right', mobile: 'hide',
      cell: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Popover className="w-48 p-1.5" trigger={({ toggle, open }) => <IconButton icon={MoreHorizontal} label="Acciones" tipPos="left" onClick={toggle} active={open} />}>
            {(close) => (
              <>
                <MenuItem icon={Eye} onClick={() => { close(); navigate(`/reservas/${r.id}`); }}>Ver detalles</MenuItem>
                <MenuItem icon={Pencil} disabled={r.status === 'cancelled' || isLocked(r)} onClick={() => { close(); editReservation(r.id); }}>Editar</MenuItem>
                <MenuItem icon={CreditCard} disabled={r.status === 'cancelled' || balanceOf(r, payments) <= 0.005} onClick={() => { close(); openPayment(r.id); }}>Registrar pago</MenuItem>
                <MenuItem icon={Ban} danger disabled={r.status === 'cancelled' || isLocked(r)} onClick={() => { close(); void actions.cancel(r); }}>Cancelar reserva</MenuItem>
              </>
            )}
          </Popover>
        </div>
      ),
    },
  ];

  const totals = useMemo(() => {
    const t = { USD: 0, ARS: 0 };
    rows.forEach((r) => { if (r.status !== 'cancelled') t[r.currency] += totalOf(r.breakdown); });
    return t;
  }, [rows]);

  return (
    <>
      <PageHeader
        title="Reservas"
        description={`${plural(rows.length, 'reserva', 'reservas')}${filtered ? ` de ${reservations.length}` : ''} · ${[totals.USD > 0 && money(totals.USD, 'USD'), totals.ARS > 0 && money(totals.ARS, 'ARS')].filter(Boolean).join(' + ') || 'sin importes'} (sin canceladas)`}
        actions={<><Button icon={Download} onClick={exportCSV} disabled={rows.length === 0}>Exportar CSV</Button><Button variant="primary" icon={Plus} onClick={() => newEntry()}>Nueva reserva</Button></>}
      />
      <Card padded={false}>
        <div className="grid gap-2 border-b border-line p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(180px,1.4fr)_repeat(3,minmax(120px,1fr))_auto_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por huésped o código" aria-label="Buscar reservas" className="pl-9" />
          </div>
          <Select aria-label="Canal" value={channel} onChange={(e) => setParam('canal', e.target.value)}>
            <option value="all">Todos los canales</option>
            {CHANNEL_IDS.map((c) => <option key={c} value={c}>{CHANNEL[c].label}</option>)}
          </Select>
          <Select aria-label="Estado" value={status} onChange={(e) => setParam('estado', e.target.value)}>
            <option value="all">Todos los estados</option>
            {RESERVATION_STATUSES.map((s) => <option key={s} value={s}>{RES_STATUS[s].label}</option>)}
          </Select>
          <Select aria-label="Pago" value={pay} onChange={(e) => setParam('pago', e.target.value === 'pending' ? 'pendiente' : e.target.value === 'paid' ? 'pagada' : 'all')}>
            <option value="all">Pagadas y pendientes</option>
            <option value="paid">Pagadas</option>
            <option value="pending">Con saldo pendiente</option>
          </Select>
          <div className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-1">
            <Input type="date" aria-label="Estadía desde" data-tip="Estadías desde" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full lg:w-[9.25rem]" />
            <span className="text-xs text-muted">al</span>
            <Input type="date" aria-label="Estadía hasta" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="w-full lg:w-[9.25rem]" />
          </div>
          <Button variant="ghost" icon={FilterX} onClick={clear} disabled={!filtered}>Limpiar</Button>
        </div>
        {propertyFilter !== 'all' && (
          <p className="border-b border-line bg-subtle px-4 py-2 text-xs text-muted">Mostrando sólo <strong className="text-ink">{properties.find((p) => p.id === propertyFilter)?.internalName}</strong> (filtro de departamento de la barra superior).</p>
        )}
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/reservas/${r.id}`)}
          initialSort={{ key: 'in', dir: 'desc' }}
          empty={<EmptyState icon={ClipboardList} title={filtered ? 'Ninguna reserva coincide con los filtros' : 'Todavía no hay reservas'} description={filtered ? 'Probá con otros filtros o limpialos.' : 'Creá la primera desde acá o arrastrando sobre el calendario.'} action={filtered ? <Button onClick={clear}>Limpiar filtros</Button> : <Button variant="primary" icon={Plus} onClick={() => newEntry()}>Nueva reserva</Button>} />}
        />
      </Card>
    </>
  );
}
