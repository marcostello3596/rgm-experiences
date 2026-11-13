import { useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Ban, ChevronLeft, ChevronRight, Info, Pencil, Plus, Save, SlidersHorizontal, Sun, Snowflake, Trash2 } from 'lucide-react';
import type { ID, ISODate, Property, Season } from '@/types';
import { useStore } from '@/store/useStore';
import { useToday } from '@/store/hooks';
import { services } from '@/services';
import { DomainError, isActive } from '@/domain/reservations';
import { indexRates, priceForNight, rateKey } from '@/domain/pricing';
import { addDays, addMonths, eachDay, endOfMonthExclusive, fmtDate, fmtMonthYear, nightsBetween, startOfMonth, weekday, weekdayShort } from '@/lib/dates';
import { money, plural, SYMBOL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Notice, NumberInput, PageHeader, Segmented, Select, Tabs } from '@/ui/primitives';
import { confirm, Modal } from '@/ui/overlays';

type Tab = 'calendario' | 'reglas' | 'temporadas';
interface Sel { r0: number; r1: number; d0: number; d1: number }
const DAY_W = 58;
const LEFT_W = 176;

export default function RatesPage() {
  const [tab, setTab] = useState<Tab>('calendario');
  const [bulk, setBulk] = useState<{ propertyIds: ID[]; start: ISODate; end: ISODate } | null>(null);
  const today = useToday();
  return (
    <>
      <PageHeader
        title="Tarifas y disponibilidad"
        description={services.mode === 'live' ? 'Precio por noche y estadía mínima de cada departamento, guardados en Beds24 (es lo que ven los canales conectados).' : 'Precio por noche de cada departamento. Los cambios se guardan sólo en la demo; con Beds24 se enviarán al inventario central.'}
        actions={<Button variant="primary" icon={SlidersHorizontal} onClick={() => setBulk({ propertyIds: [], start: today, end: addDays(today, 7) })}>Edición masiva</Button>}
      />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'calendario', label: 'Calendario de tarifas' }, { value: 'reglas', label: 'Reglas por departamento' }, ...(services.policy.seasonalPricing ? [{ value: 'temporadas' as const, label: 'Temporadas' }] : [])]} />
      {tab === 'calendario' && <RateCalendar onBulk={setBulk} />}
      {tab === 'reglas' && <RulesTable />}
      {tab === 'temporadas' && <Seasons />}
      {bulk && <BulkModal initial={bulk} onClose={() => setBulk(null)} />}
    </>
  );
}

/* ---------- Calendario de tarifas ---------- */

function RateCalendar({ onBulk }: { onBulk: (b: { propertyIds: ID[]; start: ISODate; end: ISODate }) => void }) {
  const seasonal = services.policy.seasonalPricing;
  const { properties, rates, seasons, reservations, blocks, propertyFilter } = useStore();
  const today = useToday();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [sel, setSelState] = useState<Sel | null>(null);
  const selRef = useRef<Sel | null>(null);
  const setSel = (v: Sel | null) => { selRef.current = v; setSelState(v); };
  const drag = useRef<{ r: number; d: number } | null>(null);

  const rows = useMemo(() => properties.filter((p) => p.active && (propertyFilter === 'all' || p.id === propertyFilter)), [properties, propertyFilter]);
  const days = useMemo(() => eachDay(month, endOfMonthExclusive(month)), [month]);
  const rateIndex = useMemo(() => indexRates(rates), [rates]);
  const busy = useMemo(() => {
    const set = new Map<string, 'res' | 'block'>();
    const end = endOfMonthExclusive(month);
    for (const r of reservations) if (isActive(r) && r.checkOut > month && r.checkIn < end) for (const d of eachDay(r.checkIn > month ? r.checkIn : month, r.checkOut < end ? r.checkOut : end)) set.set(rateKey(r.propertyId, d), 'res');
    for (const b of blocks) if (b.end > month && b.start < end) for (const d of eachDay(b.start > month ? b.start : month, b.end < end ? b.end : end)) set.set(rateKey(b.propertyId, d), 'block');
    return set;
  }, [reservations, blocks, month]);

  const cellAt = (e: React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    return el ? { r: Number(el.dataset.r), d: Number(el.dataset.d) } : null;
  };
  const down = (e: React.PointerEvent) => { const c = cellAt(e); if (!c || e.button !== 0) return; drag.current = c; setSel({ r0: c.r, r1: c.r, d0: c.d, d1: c.d }); };
  const move = (e: React.PointerEvent) => {
    if (!drag.current || e.pointerType !== 'mouse') return;
    const c = cellAt(e); if (!c) return;
    const a = drag.current;
    setSel({ r0: Math.min(a.r, c.r), r1: Math.max(a.r, c.r), d0: Math.min(a.d, c.d), d1: Math.max(a.d, c.d) });
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    const s = selRef.current;
    setSel(null);
    if (s) onBulk({ propertyIds: rows.slice(s.r0, s.r1 + 1).map((p) => p.id), start: days[s.d0], end: addDays(days[s.d1], 1) });
  };

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} label="Mes anterior" tipPos="top" onClick={() => setMonth(addMonths(month, -1))} />
          <Button size="sm" onClick={() => setMonth(startOfMonth(today))}>Este mes</Button>
          <IconButton icon={ChevronRight} label="Mes siguiente" tipPos="top" onClick={() => setMonth(addMonths(month, 1))} />
        </div>
        <h2 className="text-[15px] font-semibold text-ink first-letter:uppercase">{fmtMonthYear(month)}</h2>
        <ul className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-accent" />{seasonal ? 'Tarifa cargada a mano' : 'Distinto del precio de referencia'}</li>
          {seasonal && <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-warn-soft ring-1 ring-warn/30" />Temporada alta</li>}
          {seasonal && <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-info-soft ring-1 ring-info/30" />Temporada baja</li>}
          {!seasonal && <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-soft" />Sin precio en Beds24</li>}
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-black/10" />Ocupado o bloqueado</li>
        </ul>
      </div>
      <p className="border-b border-line bg-subtle px-4 py-2 text-xs text-muted">Arrastrá sobre las celdas (podés abarcar varios departamentos) para cambiar precio, estadía mínima o bloquear fechas.</p>
      {rows.length === 0 ? <EmptyState icon={Info} title="No hay departamentos activos para mostrar" /> : (
        <div className="scroll-thin overflow-auto" style={{ maxHeight: 'max(360px, calc(100dvh - 330px))' }}>
          <div className="relative select-none" style={{ width: LEFT_W + days.length * DAY_W }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => { if (drag.current) up(); }}>
            <div className="sticky top-0 z-20 flex border-b border-line bg-surface">
              <div className="sticky left-0 z-30 shrink-0 border-r border-line bg-surface px-3 py-2 text-xs font-medium text-muted" style={{ width: LEFT_W }}>Departamento · base</div>
              {days.map((d) => (
                <div key={d} className={cn('flex shrink-0 flex-col items-center border-l border-line/70 py-1.5 leading-none', (weekday(d) === 5 || weekday(d) === 6) && 'bg-black/[0.025]')} style={{ width: DAY_W }}>
                  <span className={cn('text-[10px] uppercase', d === today ? 'font-semibold text-accent' : 'text-soft')}>{weekdayShort(d)}</span>
                  <span className={cn('mt-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-xs tnum', d === today ? 'bg-accent font-semibold text-white' : 'font-medium text-ink')}>{Number(d.slice(8))}</span>
                </div>
              ))}
            </div>
            {rows.map((p, r) => (
              <div key={p.id} className="flex border-b border-line/80 last:border-b-0">
                <div className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-line bg-surface px-3" style={{ width: LEFT_W, height: 46 }}>
                  <span className="truncate text-[13px] font-medium text-ink">{p.internalName}</span>
                  <span className="text-[11px] text-muted tnum">{money(p.basePrice, p.currency)} · mín. {p.minStay} n</span>
                </div>
                {days.map((d, i) => {
                  const np = priceForNight(p, d, rateIndex, seasons);
                  const state = busy.get(rateKey(p.id, d));
                  const selected = sel && r >= sel.r0 && r <= sel.r1 && i >= sel.d0 && i <= sel.d1;
                  return (
                    <div
                      key={d}
                      data-cell data-r={r} data-d={i}
                      title={`${p.internalName} · ${fmtDate(d)} · ${money(np.price, p.currency)}${np.source === 'season' ? ` (${np.season?.name})` : np.source === 'override' ? ' (cargada a mano)' : np.source === 'weekend' ? ' (fin de semana)' : ''} · mín. ${np.minStay} n${state === 'res' ? ' · reservado' : state === 'block' ? ' · bloqueado' : ''}`}
                      className={cn(
                        'relative flex shrink-0 cursor-cell flex-col items-center justify-center border-l border-line/70 text-xs tnum transition-colors',
                        np.source === 'season' && (np.season?.type === 'high' ? 'bg-warn-soft/60' : 'bg-info-soft/60'),
                        state && 'bg-black/[0.07] text-soft',
                        !state && 'text-ink hover:bg-accent/5',
                        selected && '!bg-accent/15 ring-1 ring-accent ring-inset',
                      )}
                      style={{ width: DAY_W, height: 46 }}
                    >
                      {np.source === 'override' && (seasonal || np.price !== p.basePrice) && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-accent" />}
                      <span className={cn('font-medium', np.source === 'override' && (seasonal || np.price !== p.basePrice) && !state && 'text-accent', !seasonal && np.source !== 'override' && 'text-soft')}>{state === 'block' ? <Ban className="size-3.5" /> : !seasonal && np.source !== 'override' ? '—' : np.price}</span>
                      {np.minStay !== p.minStay && <span className="mt-0.5 text-[9px] leading-none text-muted">mín. {np.minStay}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---------- Edición masiva ---------- */

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];
const WD_LABEL = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function BulkModal({ initial, onClose }: { initial: { propertyIds: ID[]; start: ISODate; end: ISODate }; onClose: () => void }) {
  const { properties, run } = useStore();
  const active = properties.filter((p) => p.active);
  const [mode, setMode] = useState<'rates' | 'block'>('rates');
  const [ids, setIds] = useState<ID[]>(initial.propertyIds.length ? initial.propertyIds : []);
  const [start, setStart] = useState(initial.start);
  const [endIncl, setEndIncl] = useState(addDays(initial.end, -1));
  const [priceMode, setPriceMode] = useState<'keep' | 'set' | 'reset'>('set');
  const [price, setPrice] = useState<number | ''>('');
  const [minMode, setMinMode] = useState<'keep' | 'set' | 'reset'>('keep');
  const [minStay, setMinStay] = useState<number | ''>(2);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const end = addDays(endIncl, 1);
  const nightsCount = nightsBetween(start, end);
  const currencies = [...new Set(active.filter((p) => ids.includes(p.id)).map((p) => p.currency))];
  const toggle = (id: ID) => setIds((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const nothing = mode === 'rates' && priceMode === 'keep' && minMode === 'keep';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (ids.length === 0) throw new DomainError('Elegí al menos un departamento.');
      if (nightsCount < 1) throw new DomainError('La fecha final tiene que ser igual o posterior a la inicial.');
      if (mode === 'block') {
        await run(async () => { for (const propertyId of ids) await services.availability.createBlock({ propertyId, start, end, type: 'other', reason: reason.trim() }); }, { rethrow: true, success: `Fechas bloqueadas en ${plural(ids.length, 'departamento', 'departamentos')}.` });
      } else {
        if (priceMode === 'set' && !(Number(price) > 0)) throw new DomainError('Ingresá el precio por noche.');
        await run(() => services.pricing.applyRates({
          propertyIds: ids, start, end, weekdays,
          price: priceMode === 'set' ? Number(price) : priceMode === 'reset' ? null : undefined,
          minStay: minMode === 'set' ? Number(minStay) : minMode === 'reset' ? null : undefined,
        }), { rethrow: true, success: 'Tarifas actualizadas.' });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const three = (v: 'keep' | 'set' | 'reset', on: (x: 'keep' | 'set' | 'reset') => void) => <Segmented size="sm" value={v} onChange={on} options={[{ value: 'keep', label: 'No cambiar' }, { value: 'set', label: 'Fijar' }, { value: 'reset', label: 'Volver al heredado' }]} />;

  return (
    <Modal open onClose={onClose} title="Edición masiva" description={`${plural(Math.max(0, nightsCount), 'noche', 'noches')} · ${plural(ids.length, 'departamento', 'departamentos')}`}
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" type="submit" form="bulk-form" loading={saving} disabled={nothing}>{mode === 'block' ? 'Bloquear fechas' : 'Aplicar cambios'}</Button></>}>
      <form id="bulk-form" onSubmit={submit} className="space-y-5">
        <Segmented value={mode} onChange={setMode} options={[{ value: 'rates', label: 'Precio y estadía mínima' }, { value: 'block', label: 'Bloquear disponibilidad', icon: Ban }]} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde"><Input type="date" value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value > endIncl) setEndIncl(e.target.value); }} required /></Field>
          <Field label="Hasta (inclusive)"><Input type="date" value={endIncl} min={start} onChange={(e) => setEndIncl(e.target.value)} required /></Field>
        </div>
        <fieldset>
          <legend className="mb-2 flex w-full items-center justify-between text-[13px] font-medium text-body">
            Departamentos
            <button type="button" className="text-xs font-medium text-accent hover:underline" onClick={() => setIds(ids.length === active.length ? [] : active.map((p) => p.id))}>{ids.length === active.length ? 'Quitar todos' : 'Elegir todos'}</button>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {active.map((p) => <button key={p.id} type="button" aria-pressed={ids.includes(p.id)} onClick={() => toggle(p.id)} className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition', ids.includes(p.id) ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-body hover:bg-subtle')}>{p.internalName}</button>)}
          </div>
        </fieldset>

        {mode === 'rates' ? (
          <>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-body">Noches de la semana <span className="font-normal text-muted">(sin elegir = todas)</span></legend>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((w) => <button key={w} type="button" aria-pressed={weekdays.includes(w)} aria-label={['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][w]} onClick={() => setWeekdays((x) => (x.includes(w) ? x.filter((y) => y !== w) : [...x, w]))} className={cn('size-8 rounded-lg border text-xs font-semibold transition', weekdays.includes(w) ? 'border-accent bg-accent text-white' : 'border-line-strong text-body hover:bg-subtle')}>{WD_LABEL[w]}</button>)}
                <button type="button" className="ml-2 text-xs font-medium text-accent hover:underline" onClick={() => setWeekdays([5, 6])}>Fin de semana</button>
              </div>
            </fieldset>
            <div className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-ink">Precio por noche</span>{three(priceMode, setPriceMode)}</div>
              {priceMode === 'set' && <div className="mt-3 max-w-48"><NumberInput value={price} onChange={setPrice} min={1} prefix={currencies.length === 1 ? SYMBOL[currencies[0]] : undefined} placeholder="Importe" autoFocus aria-label="Precio por noche" /></div>}
              {priceMode === 'set' && currencies.length > 1 && <p className="mt-2 text-xs text-warn">Elegiste departamentos con monedas distintas: el número se aplica tal cual a cada uno, en su moneda.</p>}
              {priceMode === 'reset' && <p className="mt-2 text-xs text-muted">Se borra la tarifa cargada y vuelve a regir el precio base, de fin de semana o de temporada.</p>}
            </div>
            <div className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-ink">Estadía mínima</span>{three(minMode, setMinMode)}</div>
              {minMode === 'set' && <div className="mt-3 max-w-48"><NumberInput value={minStay} onChange={setMinStay} min={1} step={1} aria-label="Estadía mínima en noches" /></div>}
            </div>
          </>
        ) : (
          <>
            <Field label="Motivo" optional><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: mantenimiento general" maxLength={80} /></Field>
            <Notice tone="amber" icon={Info}>No se puede bloquear un departamento que ya tiene una reserva activa en esas fechas. Los bloqueos se ven en el calendario y se quitan desde ahí.</Notice>
          </>
        )}
        {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
      </form>
    </Modal>
  );
}

/* ---------- Reglas por departamento ---------- */

type RuleKey = 'basePrice' | 'weekendPrice' | 'cleaningFee' | 'minStay' | 'maxStay' | 'weeklyDiscount' | 'monthlyDiscount';
const RULES: { key: RuleKey; label: string; money?: boolean; pct?: boolean }[] = [
  { key: 'basePrice', label: 'Precio base', money: true }, { key: 'weekendPrice', label: 'Fin de semana', money: true }, { key: 'cleaningFee', label: 'Limpieza', money: true },
  { key: 'minStay', label: 'Estadía mín.' }, { key: 'maxStay', label: 'Estadía máx.' }, { key: 'weeklyDiscount', label: 'Desc. semanal', pct: true }, { key: 'monthlyDiscount', label: 'Desc. mensual', pct: true },
];

function RulesTable() {
  const { properties, propertyFilter, run } = useStore();
  const seasonal = services.policy.seasonalPricing;
  const rules = RULES.filter((r) => seasonal || !['weekendPrice', 'weeklyDiscount', 'monthlyDiscount'].includes(r.key)).map((r) => (r.key === 'basePrice' && !seasonal ? { ...r, label: 'Precio de referencia' } : r));
  const [draft, setDraft] = useState<Record<ID, Partial<Record<RuleKey, number | ''>>>>({});
  const [saving, setSaving] = useState(false);
  const rows = properties.filter((p) => propertyFilter === 'all' || p.id === propertyFilter);
  const dirtyIds = Object.keys(draft).filter((id) => Object.keys(draft[id]).length > 0);
  const value = (p: Property, k: RuleKey): number | '' => (draft[p.id]?.[k] !== undefined ? draft[p.id][k]! : p[k] ?? '');
  const change = (p: Property, k: RuleKey, v: number | '') => setDraft((d) => {
    const next = { ...d[p.id], [k]: v };
    if ((p[k] ?? '') === v) delete next[k];
    return { ...d, [p.id]: next };
  });
  const save = async () => {
    setSaving(true);
    const ok = await run(async () => {
      for (const id of dirtyIds) {
        const patch: Partial<Property> = {};
        for (const [k, v] of Object.entries(draft[id]) as [RuleKey, number | ''][]) {
          if (k === 'weekendPrice') patch.weekendPrice = v === '' ? undefined : v;
          else patch[k] = v === '' ? 0 : v;
        }
        await services.properties.update(id, patch);
      }
      return true;
    }, { success: 'Reglas guardadas.' });
    setSaving(false);
    if (ok) setDraft({});
  };

  return (
    <Card padded={false}>
      <CardHeader className="mb-0 px-5 pt-5 pb-4" title="Reglas por departamento" hint={seasonal ? "Precio base, fin de semana (viernes y sábado), límites de estadía y descuentos por estadías de 7 y 28 noches o más." : "Estadía mínima, máxima y limpieza se guardan en Beds24. El precio de referencia sólo se usa para sugerir importes y vive en este navegador; los precios por noche se cambian en el calendario de tarifas."}
        action={<><Button size="sm" onClick={() => setDraft({})} disabled={dirtyIds.length === 0}>Descartar</Button><Button size="sm" variant="primary" icon={Save} onClick={save} loading={saving} disabled={dirtyIds.length === 0}>Guardar{dirtyIds.length > 0 ? ` (${dirtyIds.length})` : ''}</Button></>} />
      <div className="scroll-thin overflow-x-auto border-t border-line">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead><tr className="border-b border-line text-xs text-muted"><th className="px-5 py-2.5 text-left font-medium">Departamento</th>{rules.map((r) => <th key={r.key} className="px-2 py-2.5 text-left font-medium">{r.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line/70 last:border-0">
                <td className="px-5 py-2"><span className="font-medium text-ink">{p.internalName}</span><span className="ml-2 text-xs text-muted">{p.currency}</span>{!p.active && <Badge className="ml-2">Inactivo</Badge>}</td>
                {rules.map((r) => {
                  const changed = draft[p.id]?.[r.key] !== undefined;
                  return <td key={r.key} className="px-2 py-2"><NumberInput aria-label={`${r.label} de ${p.internalName}`} value={value(p, r.key)} onChange={(v) => change(p, r.key, v)} min={0} max={r.pct ? 90 : undefined} prefix={r.money ? SYMBOL[p.currency] : r.pct ? '%' : undefined} placeholder={r.key === 'weekendPrice' ? String(p.basePrice) : undefined} className={cn('h-8 w-28', changed && 'border-accent bg-accent-soft/40')} /></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- Temporadas ---------- */

function Seasons() {
  const { seasons, run } = useStore();
  const today = useToday();
  const [editing, setEditing] = useState<Season | 'new' | null>(null);
  const sorted = [...seasons].sort((a, b) => a.start.localeCompare(b.start));
  const current = sorted.filter((s) => s.end > today);
  const past = sorted.filter((s) => s.end <= today);
  const remove = async (s: Season) => {
    if (await confirm({ title: `Eliminar "${s.name}"`, message: 'Las noches de esa temporada vuelven al precio base. Las tarifas cargadas a mano no cambian.', confirmLabel: 'Eliminar temporada' })) await run(() => services.pricing.removeSeason(s.id), { success: 'Temporada eliminada.' });
  };
  const item = (s: Season) => (
    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', s.type === 'high' ? 'bg-warn-soft text-warn' : 'bg-info-soft text-info')}>{s.type === 'high' ? <Sun className="size-4" /> : <Snowflake className="size-4" />}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-ink">{s.name}</span><span className="block text-xs text-muted">{fmtDate(s.start)} al {fmtDate(addDays(s.end, -1))} · {s.type === 'high' ? 'Temporada alta' : 'Temporada baja'}</span></span>
      <span className={cn('text-sm font-semibold tnum', s.adjustPct >= 0 ? 'text-warn' : 'text-info')}>{s.adjustPct > 0 ? '+' : ''}{s.adjustPct} %</span>
      <IconButton icon={Pencil} label="Editar" tipPos="top" onClick={() => setEditing(s)} />
      <IconButton icon={Trash2} label="Eliminar" tipPos="left" onClick={() => void remove(s)} />
    </li>
  );
  return (
    <Card padded={false} className="max-w-3xl">
      <CardHeader className="mb-0 px-5 pt-5 pb-4" title="Temporadas" hint="Ajustan en un porcentaje el precio base y el de fin de semana de todos los departamentos. Una tarifa cargada a mano para una fecha siempre tiene prioridad." action={<Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing('new')}>Nueva temporada</Button>} />
      {sorted.length === 0 ? <EmptyState icon={Sun} title="Sin temporadas" description="Creá una temporada alta o baja para ajustar precios por fechas." /> : (
        <>
          <ul className="divide-y divide-line border-t border-line">{current.map(item)}</ul>
          {past.length > 0 && <details className="border-t border-line"><summary className="cursor-pointer px-5 py-3 text-xs font-medium text-muted hover:text-ink">Temporadas pasadas ({past.length})</summary><ul className="divide-y divide-line border-t border-line">{past.map(item)}</ul></details>}
        </>
      )}
      {editing && <SeasonModal season={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

function SeasonModal({ season, onClose }: { season: Season | null; onClose: () => void }) {
  const run = useStore((s) => s.run);
  const today = useToday();
  const [name, setName] = useState(season?.name ?? '');
  const [type, setType] = useState<Season['type']>(season?.type ?? 'high');
  const [start, setStart] = useState(season?.start ?? today);
  const [endIncl, setEndIncl] = useState(season ? addDays(season.end, -1) : addDays(today, 30));
  const [pctValue, setPctValue] = useState<number | ''>(season ? Math.abs(season.adjustPct) : 20);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await run(() => services.pricing.saveSeason({ id: season?.id, name: name.trim(), type, start, end: addDays(endIncl, 1), adjustPct: (type === 'high' ? 1 : -1) * Number(pctValue || 0) }), { rethrow: true, success: 'Temporada guardada.' });
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar.'); }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={season ? 'Editar temporada' : 'Nueva temporada'} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" type="submit" form="season-form">Guardar</Button></>}>
      <form id="season-form" onSubmit={submit} className="space-y-4">
        <Field label="Nombre"><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ej.: Vacaciones de invierno" /></Field>
        <Segmented value={type} onChange={setType} options={[{ value: 'high', label: 'Temporada alta', icon: Sun }, { value: 'low', label: 'Temporada baja', icon: Snowflake }]} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} required /></Field>
          <Field label="Hasta (inclusive)"><Input type="date" value={endIncl} min={start} onChange={(e) => setEndIncl(e.target.value)} required /></Field>
        </div>
        <Field label={type === 'high' ? 'Aumento sobre el precio base' : 'Rebaja sobre el precio base'}><Select value={String(pctValue)} onChange={(e) => setPctValue(Number(e.target.value))}>{[5, 10, 12, 15, 20, 25, 30, 40, 50].map((v) => <option key={v} value={v}>{type === 'high' ? '+' : '−'}{v} %</option>)}</Select></Field>
        {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
      </form>
    </Modal>
  );
}
