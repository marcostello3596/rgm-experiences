import { useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, CircleDollarSign, Download, HandCoins, Info, Pencil, Plus, Receipt, Scale, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { Currency, Expense, ExpenseCategory } from '@/types';
import { CURRENCIES, EXPENSE_CATEGORIES } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookup, useMetricsSource, useMoneyView, useToday } from '@/store/hooks';
import { services } from '@/services';
import { byChannel, byProperty, expenseMetrics, lastMonths, monthlySeries, pendingPayments, rangeMetrics } from '@/domain/metrics';
import { fmtView, toView, viewCaption } from '@/domain/money';
import { fmtDate, fmtMonthShort } from '@/lib/dates';
import { money, plural, SYMBOL } from '@/lib/format';
import { downloadCSV } from '@/lib/csv';
import { CHANNEL, EXPENSE_CAT, PAY_METHOD } from '@/lib/labels';
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Kpi, Notice, NumberInput, PageHeader, Segmented, Select, Toggle } from '@/ui/primitives';
import { BarList, BarsChart, Donut } from '@/ui/charts';
import { DataTable, type Column } from '@/ui/DataTable';
import { confirm, Modal } from '@/ui/overlays';
import { PeriodPicker, presetRange, type PeriodValue } from '@/ui/domain';

export default function FinancePage() {
  const { expenses, payments, reservations, propertyFilter, settings, run } = useStore();
  const src = useMetricsSource();
  const look = useLookup();
  const today = useToday();
  const [currency, setCurrency] = useState<Currency>(settings.currency.reporting);
  const view = useMoneyView(currency);
  const [period, setPeriod] = useState<PeriodValue>(() => ({ preset: 'this_month', range: presetRange('this_month', today) }));
  const [editing, setEditing] = useState<Expense | 'new' | null>(null);
  const [cat, setCat] = useState<ExpenseCategory | 'all'>('all');
  const [paid, setPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [rate, setRate] = useState<number | ''>(settings.currency.demoRate);

  const filter = useMemo(() => ({ range: period.range, propertyId: propertyFilter }), [period.range, propertyFilter]);
  const m = useMemo(() => rangeMetrics(src, filter, view), [src, filter, view]);
  const ex = useMemo(() => expenseMetrics(src, filter, view), [src, filter, view]);
  const owed = useMemo(() => pendingPayments(src, { propertyId: propertyFilter }, view), [src, propertyFilter, view]);
  const months = useMemo(() => lastMonths(today, 6), [today]);
  const series = useMemo(() => monthlySeries(src, months, { propertyId: propertyFilter }, view).map((s, i) => ({ ...s, expenses: expenseMetrics(src, { range: months[i].range, propertyId: propertyFilter }, view).total })), [src, months, propertyFilter, view]);
  const channels = useMemo(() => byChannel(src, filter, view), [src, filter, view]);
  const profit = useMemo(() => byProperty(src, filter, view).filter((p) => p.property.active).map((p) => ({ name: p.property.internalName, value: p.net - expenseMetrics(src, { range: period.range, propertyId: p.property.id }, view).total })).sort((a, b) => b.value - a.value), [src, filter, view, period.range]);
  const fmt = (v: number) => fmtView(v, view);
  const result = m.net - ex.total;

  const rows = useMemo(() => expenses.filter((e) => e.date >= period.range.start && e.date < period.range.end && (propertyFilter === 'all' || e.propertyId === propertyFilter) && (cat === 'all' || e.category === cat) && (paid === 'all' || (paid === 'paid') === e.paid)), [expenses, period.range, propertyFilter, cat, paid]);

  const remove = async (e: Expense) => {
    if (await confirm({ title: 'Eliminar gasto', message: `${e.description} · ${money(e.amount, e.currency)}`, confirmLabel: 'Eliminar' })) await run(() => services.expenses.remove(e.id), { success: 'Gasto eliminado.' });
  };
  const columns: Column<Expense>[] = [
    { key: 'date', header: 'Fecha', cell: (e) => <span className="tnum">{fmtDate(e.date)}</span>, sort: (e) => e.date },
    { key: 'desc', header: 'Descripción', mobile: 'title', cell: (e) => <span className="font-medium text-ink">{e.description}</span>, sort: (e) => e.description },
    { key: 'cat', header: 'Categoría', cell: (e) => <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: EXPENSE_CAT[e.category].color }} />{EXPENSE_CAT[e.category].label}</span>, sort: (e) => e.category },
    { key: 'prop', header: 'Departamento', cell: (e) => look.propertyName(e.propertyId), sort: (e) => look.propertyName(e.propertyId) },
    { key: 'amount', header: 'Importe', align: 'right', cell: (e) => <span className="font-medium text-ink tnum">{money(e.amount, e.currency)}</span>, sort: (e) => toView(e.amount, e.currency, { ...view, convert: true }) ?? e.amount },
    { key: 'paid', header: 'Estado', cell: (e) => <button type="button" data-tip="Cambiar estado" onClick={(ev) => { ev.stopPropagation(); void run(() => services.expenses.save({ ...e, paid: !e.paid })); }}><Badge tone={e.paid ? 'green' : 'amber'}>{e.paid ? 'Pagado' : 'Pendiente'}</Badge></button>, sort: (e) => (e.paid ? 1 : 0) },
    { key: 'actions', header: '', align: 'right', mobile: 'hide', cell: (e) => <span className="flex justify-end" onClick={(ev) => ev.stopPropagation()}><IconButton icon={Pencil} label="Editar" tipPos="top" onClick={() => setEditing(e)} /><IconButton icon={Trash2} label="Eliminar" tipPos="left" onClick={() => void remove(e)} /></span> },
  ];

  const exportCSV = () => {
    const inRange = (d: string) => d >= period.range.start && d < period.range.end;
    const income = payments.filter((p) => inRange(p.date)).map((p) => {
      const r = reservations.find((x) => x.id === p.reservationId);
      return { date: p.date, row: [fmtDate(p.date), 'Cobro', `${r?.code ?? ''} ${r ? look.guestName(r.guestId) : ''}`.trim(), r ? look.propertyName(r.propertyId) : '', PAY_METHOD[p.method], p.currency, p.amount, 'Cobrado'] as (string | number)[] };
    }).filter((x) => propertyFilter === 'all' || x.row[3] === look.propertyName(propertyFilter));
    const out = rows.map((e) => ({ date: e.date, row: [fmtDate(e.date), 'Gasto', e.description, look.propertyName(e.propertyId), EXPENSE_CAT[e.category].label, e.currency, -e.amount, e.paid ? 'Pagado' : 'Pendiente'] as (string | number)[] }));
    downloadCSV('movimientos.csv', ['Fecha', 'Tipo', 'Concepto', 'Departamento', 'Categoría / medio', 'Moneda', 'Importe', 'Estado'], [...income, ...out].sort((a, b) => a.date.localeCompare(b.date)).map((x) => x.row));
  };

  return (
    <>
      <PageHeader
        title="Finanzas"
        description={viewCaption(view)}
        actions={<><Segmented value={currency} onChange={setCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /><PeriodPicker value={period} onChange={setPeriod} today={today} presets={['this_month', 'last_month', 'last_30', 'last_90', 'year', 'last_12']} /><Button icon={Download} onClick={exportCSV}>Exportar movimientos</Button><Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>Registrar gasto</Button></>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Ingresos brutos" value={fmt(m.gross)} icon={CircleDollarSign} hint="Reservas confirmadas y finalizadas" />
        <Kpi label="Comisiones de canales" value={fmt(m.fees)} icon={HandCoins} hint="Valores ficticios de la demo" />
        <Kpi label="Netos antes de gastos" value={fmt(m.net)} icon={Wallet} hint="Brutos − comisiones" />
        <Kpi label="Gastos operativos" value={fmt(ex.total)} icon={TrendingDown} hint={ex.unpaid > 0 ? `${fmt(ex.unpaid)} sin pagar` : 'Todos pagados'} />
        <Kpi label="Resultado operativo" value={fmt(result)} icon={result >= 0 ? TrendingUp : TrendingDown} tone={result >= 0 ? 'green' : 'red'} hint="Netos − gastos" />
        <Kpi label="Pagos pendientes" value={fmt(owed.amount)} icon={Scale} tone={owed.count ? 'amber' : undefined} hint={plural(owed.count, 'reserva por cobrar', 'reservas por cobrar')} to="/reservas?pago=pendiente" />
      </div>
      {(m.excludedByCurrency > 0 || ex.excludedByCurrency > 0) && (
        <Notice tone="blue" icon={Info} className="mb-4">Quedaron afuera {plural(m.excludedByCurrency, 'reserva', 'reservas')} y {plural(ex.excludedByCurrency, 'gasto', 'gastos')} en {currency === 'USD' ? 'ARS' : 'USD'}: no se suman monedas distintas sin conversión. Mirá la otra moneda con el selector o activá la conversión acá abajo.</Notice>
      )}

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Ingresos por mes" hint={`Últimos 6 meses · ${currency}`} />
          <BarsChart data={series.map((s) => ({ label: fmtMonthShort(s.key), net: Math.round(s.net), expenses: Math.round(s.expenses), result: Math.round(s.net - s.expenses) }))} series={[{ key: 'net', label: 'Ingresos netos', color: '#3d1a22' }, { key: 'expenses', label: 'Gastos', color: '#c9a37a' }, { key: 'result', label: 'Resultado', color: '#2e9e6b' }]} format={fmt} />
        </Card>
        <Card>
          <CardHeader title="Gastos por categoría" hint="En el período elegido" />
          <Donut data={ex.byCategory.map((c) => ({ name: EXPENSE_CAT[c.category].label, value: Math.round(c.amount), color: EXPENSE_CAT[c.category].color }))} format={fmt} center={<><span className="text-lg font-semibold text-ink tnum">{fmt(ex.total)}</span><span className="text-[11px] text-muted">gastos</span></>} />
        </Card>
        <Card>
          <CardHeader title="Rentabilidad por departamento" hint="Ingresos netos − gastos asignados al departamento (los gastos generales no se reparten)" />
          <div className="scroll-thin max-h-72 overflow-y-auto pr-1"><BarList items={profit.map((p) => ({ label: p.name, value: Math.round(p.value) }))} format={fmt} /></div>
        </Card>
        <Card>
          <CardHeader title="Facturación por canal" hint="Ingresos brutos del período" />
          <Donut data={channels.map((c) => ({ name: CHANNEL[c.channel].label, value: Math.round(c.gross), color: CHANNEL[c.channel].color }))} format={fmt} center={<><span className="text-lg font-semibold text-ink tnum">{fmt(m.gross)}</span><span className="text-[11px] text-muted">brutos</span></>} />
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader title="Conversión entre monedas" hint="Las reservas y los gastos se guardan en su moneda original. La conversión sólo afecta a los totales de indicadores y gráficos." />
        <div className="grid items-end gap-x-8 gap-y-2 md:grid-cols-[1fr_auto]">
          <Toggle checked={settings.currency.convert} onChange={(v) => void run(() => services.settings.update({ currency: { ...settings.currency, convert: v } }), { success: v ? 'Conversión activada.' : 'Conversión desactivada.' })} label="Convertir la otra moneda en los totales" description="Apagado: los importes en otra moneda quedan fuera de cada total. Prendido: se convierten con el tipo de cambio ficticio." />
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void run(() => services.settings.update({ currency: { ...settings.currency, demoRate: Number(rate) } }), { success: 'Tipo de cambio ficticio actualizado.' }); }}>
            <Field label={<>Tipo de cambio <Badge tone="violet">Ficticio</Badge></>} hint="ARS por cada 1 USD"><NumberInput value={rate} onChange={setRate} min={1} prefix="$" className="w-36" /></Field>
            <Button type="submit" className="mb-[22px]" disabled={Number(rate) === settings.currency.demoRate || !(Number(rate) > 0)}>Guardar</Button>
          </form>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="mb-0 flex-wrap px-5 pt-5 pb-4" title="Registro de gastos" hint={`${plural(rows.length, 'gasto', 'gastos')} en el período · no genera comprobantes fiscales`}
          action={<>
            <Select aria-label="Categoría" value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="h-8 w-44 text-[13px]"><option value="all">Todas las categorías</option>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CAT[c].label}</option>)}</Select>
            <Select aria-label="Estado" value={paid} onChange={(e) => setPaid(e.target.value as typeof paid)} className="h-8 w-32 text-[13px]"><option value="all">Todos</option><option value="paid">Pagados</option><option value="unpaid">Pendientes</option></Select>
          </>} />
        <div className="border-t border-line">
          <DataTable rows={rows} columns={columns} rowKey={(e) => e.id} onRowClick={setEditing} initialSort={{ key: 'date', dir: 'desc' }} pageSize={12} dense
            empty={<EmptyState icon={Receipt} title="Sin gastos en este período" description="Cambiá el período o los filtros, o registrá un gasto." action={<Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>Registrar gasto</Button>} />} />
        </div>
      </Card>
      {editing && <ExpenseModal expense={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ExpenseModal({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const { properties, propertyFilter, run } = useStore();
  const today = useToday();
  const [f, setF] = useState<Omit<Expense, 'id' | 'amount'> & { amount: number | '' }>(expense ?? { propertyId: propertyFilter === 'all' ? null : propertyFilter, date: today, category: 'cleaning', description: '', amount: '', currency: 'ARS', paid: true });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await run(() => services.expenses.save({ ...f, id: expense?.id, amount: Number(f.amount || 0), description: f.description.trim() }), { rethrow: true, success: expense ? 'Gasto actualizado.' : 'Gasto registrado.' });
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar.'); } finally { setSaving(false); }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={expense ? 'Editar gasto' : 'Registrar gasto'} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" type="submit" form="expense-form" loading={saving}>Guardar</Button></>}>
      <form id="expense-form" onSubmit={submit} className="space-y-4">
        <Field label="Descripción"><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required autoFocus maxLength={100} placeholder="Ej.: limpieza post check-out" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as ExpenseCategory })}>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CAT[c].label}</option>)}</Select></Field>
          <Field label="Fecha"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
          <Field label="Moneda"><Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value as Currency })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Importe"><NumberInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} min={0} step="0.01" prefix={SYMBOL[f.currency]} required /></Field>
        </div>
        <Field label="Departamento"><Select value={f.propertyId ?? ''} onChange={(e) => setF({ ...f, propertyId: e.target.value || null })}><option value="">General (sin asignar)</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.internalName}</option>)}</Select></Field>
        <Toggle checked={f.paid} onChange={(v) => setF({ ...f, paid: v })} label="Ya está pagado" />
        {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
      </form>
    </Modal>
  );
}
