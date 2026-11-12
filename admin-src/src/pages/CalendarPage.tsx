import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Ban, Building2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarBlock, Guest, ID, ISODate, Property, Reservation } from '@/types';
import { useStore } from '@/store/useStore';
import { guestName, useToday } from '@/store/hooks';
import { findConflict, isActive, nights, totalOf } from '@/domain/reservations';
import { addDays, addMonths, diffDays, eachDay, fmtDate, fmtMonthYear, fmtShort, startOfMonth, weekday, weekdayShort } from '@/lib/dates';
import { money, plural } from '@/lib/format';
import { BLOCK_COLOR, BLOCK_TYPE, CHANNEL, RES_STATUS } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { Button, Card, EmptyState, IconButton, Input, PageHeader, Segmented } from '@/ui/primitives';
import { ChannelLegend, PropertyPhoto } from '@/ui/domain';
import { useUI } from '@/features/ui-store';

/**
 * CALENDARIO MULTIDEPARTAMENTO
 *
 * - Una fila por departamento y una columna por día. Cada reserva es una barra que va del mediodía del check-in
 *   al mediodía del check-out, así una salida y una entrada el mismo día se ven en la misma celda sin pisarse.
 * - Las celdas no son elementos del DOM: la grilla se dibuja con fondos y la posición del puntero se convierte
 *   en fecha. Sólo se renderizan las barras, por eso se mantiene fluido con muchos días y departamentos.
 * - Se dibuja una ventana de días alrededor de la fecha ancla; al acercarse a un borde la ventana se corre sola.
 * - Recibe `Reservation[]` y `CalendarBlock[]` del estado compartido: con Beds24 no cambia nada acá.
 */

type ViewDays = 7 | 14 | 30;
const PAD = 21; // días dibujados antes de la fecha ancla
const SPAN = 120; // días dibujados en total
const ROW_H = 54;
const HEAD_H = 60;
const MIN_DAY_W = 34;

interface Selection { propertyId: ID; from: number; to: number; invalid: boolean }
interface Hover { x: number; y: number; reservation?: Reservation; block?: CalendarBlock }

export default function CalendarPage() {
  const { properties, reservations, blocks, guests, propertyFilter, settings } = useStore();
  const today = useToday();
  const { newEntry, openDrawer, editBlock } = useUI();
  const toast = useStore((s) => s.toast);

  const [view, setView] = useState<ViewDays>(settings.general.defaultCalendarDays);
  const [anchor, setAnchor] = useState<ISODate>(() => addDays(today, -1));
  const [leftDate, setLeftDate] = useState<ISODate>(anchor);
  const [width, setWidth] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const settle = useRef<number | undefined>(undefined);

  const rows = useMemo(() => properties.filter((p) => p.active && (propertyFilter === 'all' || p.id === propertyFilter)), [properties, propertyFilter]);
  const leftW = width > 0 && width < 640 ? 112 : 208;
  const dayW = Math.max(MIN_DAY_W, width > 0 ? (width - leftW) / view : 48);
  const start = useMemo(() => addDays(anchor, -PAD), [anchor]);
  const days = useMemo(() => eachDay(start, addDays(start, SPAN)), [start]);
  const guestById = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);

  const byProperty = useMemo(() => {
    const limit = addDays(start, SPAN);
    const map = new Map<ID, { reservations: Reservation[]; blocks: CalendarBlock[] }>();
    for (const p of rows) map.set(p.id, { reservations: [], blocks: [] });
    for (const r of reservations) if (isActive(r) && r.checkOut >= start && r.checkIn < limit) map.get(r.propertyId)?.reservations.push(r);
    for (const b of blocks) if (b.end >= start && b.start < limit) map.get(b.propertyId)?.blocks.push(b);
    return map;
  }, [rows, reservations, blocks, start]);

  // Ancho disponible
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Al cambiar la fecha ancla, la vista o el ancho, la fecha ancla queda en el borde izquierdo
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && width > 0) el.scrollLeft = PAD * dayW;
    setLeftDate(anchor);
  }, [anchor, dayW, width]);

  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / dayW);
    const date = addDays(start, idx);
    setLeftDate((d) => (d === date ? d : date));
    setHover(null);
    window.clearTimeout(settle.current);
    // Cerca de un borde: se corre la ventana manteniendo la misma fecha a la izquierda
    settle.current = window.setTimeout(() => {
      if (idx < 4 || idx > SPAN - view - 4) setAnchor(date);
    }, 140);
  }, [dayW, start, view]);
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const finishSelection = useCallback((sel: Selection) => {
    setSelection(null);
    const property = rows.find((p) => p.id === sel.propertyId);
    if (!property) return;
    const a = Math.min(sel.from, sel.to);
    let b = Math.max(sel.from, sel.to);
    if (a === b) b = a + 1; // un clic = una noche
    let checkIn = addDays(start, a), checkOut = addDays(start, b);
    const busy = (s: ISODate, e: ISODate) => findConflict({ propertyId: property.id, start: s, end: e }, reservations, blocks);
    // Clic sobre la mitad libre de un día de entrada: se ofrece la noche anterior
    if (sel.from === sel.to && busy(checkIn, checkOut) && !busy(addDays(checkIn, -1), checkIn)) { checkOut = checkIn; checkIn = addDays(checkIn, -1); }
    const conflict = busy(checkIn, checkOut);
    if (conflict) {
      toast(conflict.kind === 'block' ? `${property.internalName} está bloqueado en esas fechas.` : `${property.internalName} ya tiene una reserva en esas fechas (${conflict.reservation.code}).`, 'error');
      return;
    }
    newEntry({ propertyId: property.id, checkIn, checkOut });
  }, [rows, start, reservations, blocks, toast, newEntry]);

  const changeSelection = useCallback((sel: Selection | null) => {
    if (!sel) return setSelection(null);
    const a = Math.min(sel.from, sel.to), b = Math.max(sel.from, sel.to);
    const invalid = a !== b && Boolean(findConflict({ propertyId: sel.propertyId, start: addDays(start, a), end: addDays(start, b) }, reservations, blocks));
    setSelection({ ...sel, invalid });
  }, [start, reservations, blocks]);

  const go = (date: ISODate) => setAnchor(date);
  const todayIdx = diffDays(start, today);
  const visibleEnd = addDays(leftDate, view - 1);
  const label = leftDate.slice(0, 7) === visibleEnd.slice(0, 7) ? fmtMonthYear(leftDate) : `${fmtShort(leftDate)} – ${fmtShort(visibleEnd)} ${visibleEnd.slice(0, 4)}`;

  return (
    <>
      <PageHeader
        title="Calendario"
        description="Arrastrá sobre días libres para crear una reserva o un bloqueo. Hacé clic en una barra para ver el detalle."
        actions={
          <>
            <Button icon={Ban} onClick={() => newEntry({ kind: 'block' })}>Bloquear fechas</Button>
            <Button variant="primary" icon={Plus} onClick={() => newEntry()}>Nueva reserva</Button>
          </>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-1">
            <IconButton icon={ChevronLeft} label={`${view} días atrás`} tipPos="top" onClick={() => go(addDays(leftDate, -view))} />
            <Button size="sm" onClick={() => go(addDays(today, -1))}>Hoy</Button>
            <IconButton icon={ChevronRight} label={`${view} días adelante`} tipPos="top" onClick={() => go(addDays(leftDate, view))} />
          </div>
          <h2 className="min-w-36 text-[15px] font-semibold text-ink first-letter:uppercase">{label}</h2>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => go(addMonths(startOfMonth(leftDate), -1))}>‹ Mes</Button>
            <Button size="sm" variant="ghost" onClick={() => go(addMonths(startOfMonth(addDays(leftDate, 1)), 1))}>Mes ›</Button>
          </div>
          <Input type="date" aria-label="Ir a una fecha" value={leftDate} onChange={(e) => e.target.value && go(e.target.value)} className="h-8 w-[9.25rem] text-[13px]" />
          <Segmented size="sm" className="ml-auto" value={view} onChange={(v) => { setAnchor(leftDate); setView(v); }} options={[{ value: 7, label: '7 días' }, { value: 14, label: '14 días' }, { value: 30, label: '30 días' }]} />
        </div>
        <div className="border-b border-line px-3 py-2 sm:px-4"><ChannelLegend /></div>

        {rows.length === 0 ? (
          <EmptyState icon={Building2} title="No hay departamentos activos para mostrar" description="Revisá el filtro de departamento o activá alguno desde Departamentos." />
        ) : (
          <div ref={scroller} onScroll={onScroll} className="scroll-thin relative overflow-auto overscroll-x-contain" style={{ maxHeight: 'max(360px, calc(100dvh - 292px))' }}>
            <div className="relative" style={{ width: leftW + SPAN * dayW }}>
              {/* Cabecera */}
              <div className="sticky top-0 z-20 flex border-b border-line bg-surface" style={{ height: HEAD_H }}>
                <div className="sticky left-0 z-30 flex shrink-0 items-end border-r border-line bg-surface px-3 pb-2 text-xs font-medium text-muted" style={{ width: leftW }}>
                  {plural(rows.length, 'departamento', 'departamentos')}
                </div>
                <DayHeader days={days} dayW={dayW} today={today} leftW={leftW} />
              </div>

              {/* Filas */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0" style={{ left: leftW, width: SPAN * dayW }} aria-hidden>
                  {days.map((d, i) => (weekday(d) === 0 || weekday(d) === 6) && <div key={d} className="absolute inset-y-0 bg-black/[0.022]" style={{ left: i * dayW, width: dayW }} />)}
                  {todayIdx >= 0 && todayIdx < SPAN && <div className="absolute inset-y-0 border-x border-accent/25 bg-accent/[0.045]" style={{ left: todayIdx * dayW, width: dayW }} />}
                </div>
                {rows.map((p) => (
                  <Row
                    key={p.id}
                    property={p}
                    items={byProperty.get(p.id)!}
                    guests={guestById}
                    start={start}
                    dayW={dayW}
                    leftW={leftW}
                    today={today}
                    viewLeft={diffDays(start, leftDate) * dayW}
                    selection={selection?.propertyId === p.id ? selection : null}
                    onSelect={changeSelection}
                    onCommit={finishSelection}
                    onOpen={openDrawer}
                    onBlock={editBlock}
                    onHover={setHover}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {hover && <HoverCard hover={hover} guests={guestById} />}
    </>
  );
}

const DayHeader = memo(function DayHeader({ days, dayW, today, leftW }: { days: ISODate[]; dayW: number; today: ISODate; leftW: number }) {
  const months = useMemo(() => {
    const out: { key: string; from: number; count: number; date: ISODate }[] = [];
    days.forEach((d, i) => {
      const last = out[out.length - 1];
      if (last && last.key === d.slice(0, 7)) last.count++;
      else out.push({ key: d.slice(0, 7), from: i, count: 1, date: d });
    });
    return out;
  }, [days]);
  const narrow = dayW < 44;
  return (
    <div className="relative" style={{ width: days.length * dayW }}>
      <div className="absolute inset-x-0 top-0 h-6">
        {months.map((m) => (
          <div key={m.key} className="absolute top-0 h-6 border-l border-line first:border-l-0" style={{ left: m.from * dayW, width: m.count * dayW }}>
            <span className="sticky inline-block px-2 pt-1.5 text-[11px] font-semibold tracking-wide whitespace-nowrap text-ink uppercase" style={{ left: leftW }}>{fmtMonthYear(m.date)}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-[34px]">
        {days.map((d) => {
          const w = weekday(d);
          const isToday = d === today;
          return (
            <div key={d} className={cn('flex shrink-0 flex-col items-center justify-center border-l border-line/70 leading-none', (w === 0 || w === 6) && 'bg-black/[0.022]')} style={{ width: dayW }}>
              <span className={cn('text-[10px] uppercase', isToday ? 'font-semibold text-accent' : 'text-soft')}>{narrow ? weekdayShort(d)[0] : weekdayShort(d)}</span>
              <span className={cn('mt-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-xs tnum', isToday ? 'bg-accent font-semibold text-white' : 'font-medium text-ink')}>{Number(d.slice(8))}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

interface RowProps {
  property: Property;
  items: { reservations: Reservation[]; blocks: CalendarBlock[] };
  guests: Map<ID, Guest>;
  start: ISODate;
  dayW: number;
  leftW: number;
  today: ISODate;
  /** Posición horizontal (px) del borde izquierdo visible: el nombre de la barra se corre para no quedar tapado. */
  viewLeft: number;
  selection: Selection | null;
  onSelect: (s: Selection | null) => void;
  onCommit: (s: Selection) => void;
  onOpen: (id: ID) => void;
  onBlock: (id: ID) => void;
  onHover: (h: Hover | null) => void;
}

const Row = memo(function Row({ property, items, guests, start, dayW, leftW, today, viewLeft, selection, onSelect, onCommit, onOpen, onBlock, onHover }: RowProps) {
  const drag = useRef<{ from: number; x: number; y: number; moved: boolean } | null>(null);
  const dayAt = (e: RPointerEvent<HTMLDivElement>) => Math.max(0, Math.min(SPAN - 1, Math.floor((e.clientX - e.currentTarget.getBoundingClientRect().left) / dayW)));

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('[data-bar]')) return;
    const from = dayAt(e);
    drag.current = { from, x: e.clientX, y: e.clientY, moved: false };
    if (e.pointerType === 'mouse') {
      e.currentTarget.setPointerCapture(e.pointerId);
      onSelect({ propertyId: property.id, from, to: from, invalid: false });
    }
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.x) > 8 || Math.abs(e.clientY - d.y) > 8) d.moved = true;
    if (e.pointerType === 'mouse') onSelect({ propertyId: property.id, from: d.from, to: dayAt(e), invalid: false });
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (e.pointerType === 'mouse') onCommit({ propertyId: property.id, from: d.from, to: dayAt(e), invalid: false });
    else if (!d.moved) onCommit({ propertyId: property.id, from: d.from, to: d.from, invalid: false }); // toque: una noche
  };
  const cancel = () => { drag.current = null; onSelect(null); };

  const geometry = (s: ISODate, e: ISODate) => {
    const a = diffDays(start, s), b = diffDays(start, e);
    const left = Math.max(0, (a + 0.5) * dayW + 1.5);
    const right = Math.min(SPAN * dayW, (b + 0.5) * dayW - 1.5);
    return { left, width: Math.max(6, right - left), clippedLeft: a < 0, clippedRight: b >= SPAN };
  };
  const sel = selection && (() => {
    const a = Math.min(selection.from, selection.to), b = Math.max(selection.from, selection.to);
    return { left: (a + 0.5) * dayW, width: Math.max(1, b - a) * dayW, nights: Math.max(1, b - a) };
  })();

  return (
    <div className="group/row flex border-b border-line/80 last:border-b-0" style={{ height: ROW_H }}>
      <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2.5 border-r border-line bg-surface px-2.5 sm:px-3" style={{ width: leftW }}>
        <PropertyPhoto property={property} className="hidden size-8 shrink-0 rounded-md sm:flex" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{property.internalName}</p>
          <p className="truncate text-[11px] text-muted">{plural(property.capacity, 'huésped', 'huéspedes')}</p>
        </div>
      </div>
      <div
        className="relative cursor-cell touch-pan-x touch-pan-y select-none"
        style={{ width: SPAN * dayW, backgroundImage: 'linear-gradient(to right, rgba(28,24,25,.07) 1px, transparent 1px)', backgroundSize: `${dayW}px 100%` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
      >
        {items.blocks.map((b) => {
          const g = geometry(b.start, b.end);
          return (
            <button
              key={b.id}
              type="button"
              data-bar
              onClick={() => onBlock(b.id)}
              onMouseEnter={(e) => onHover({ x: e.clientX, y: e.currentTarget.getBoundingClientRect().bottom, block: b })}
              onMouseLeave={() => onHover(null)}
              className={cn('absolute top-2.5 flex h-[34px] items-center gap-1.5 overflow-hidden px-2 text-left text-xs font-medium transition hover:brightness-95', g.clippedLeft ? 'rounded-l-none' : 'rounded-l-md', g.clippedRight ? 'rounded-r-none' : 'rounded-r-md')}
              style={{ left: g.left, width: g.width, color: BLOCK_COLOR.text, backgroundColor: BLOCK_COLOR.soft, backgroundImage: 'repeating-linear-gradient(135deg, rgba(75,80,88,.16) 0 6px, transparent 6px 12px)' }}
            >
              <Ban className="size-3 shrink-0" />
              <span className="truncate">{b.reason || BLOCK_TYPE[b.type]}</span>
            </button>
          );
        })}
        {items.reservations.map((r) => {
          const g = geometry(r.checkIn, r.checkOut);
          const c = CHANNEL[r.channel];
          const pending = r.status === 'pending';
          const past = r.checkOut <= today;
          const name = guestName(guests.get(r.guestId));
          return (
            <button
              key={r.id}
              type="button"
              data-bar
              onClick={() => onOpen(r.id)}
              onMouseEnter={(e) => onHover({ x: e.clientX, y: e.currentTarget.getBoundingClientRect().bottom, reservation: r })}
              onMouseLeave={() => onHover(null)}
              aria-label={`${r.code}, ${name}, ${fmtDate(r.checkIn)} al ${fmtDate(r.checkOut)}`}
              className={cn(
                'absolute top-2.5 flex h-[34px] items-center gap-1.5 overflow-hidden px-2 text-left text-xs font-medium shadow-[0_1px_2px_rgba(28,24,25,.12)] transition hover:z-[5] hover:-translate-y-px hover:shadow-[0_3px_8px_rgba(28,24,25,.18)]',
                g.clippedLeft ? 'rounded-l-none' : 'rounded-l-md', g.clippedRight ? 'rounded-r-none' : 'rounded-r-md',
                pending && 'border border-dashed', past && 'opacity-60',
              )}
              style={{ left: g.left, width: g.width, paddingLeft: Math.max(8, Math.min(viewLeft - g.left + 8, g.width - 70)), ...(pending ? { background: c.soft, color: c.text, borderColor: c.color } : { background: c.color, color: '#fff' }) }}
            >
              {g.width > 46 && <span className="truncate">{name}</span>}
              {g.width > 150 && <span className="ml-auto shrink-0 opacity-80 tnum">{nights(r)} n</span>}
            </button>
          );
        })}
        {sel && (
          <div
            className={cn('pointer-events-none absolute top-2.5 z-[6] flex h-[34px] items-center justify-center rounded-md border-2 text-[11px] font-semibold', selection!.invalid ? 'border-bad bg-bad/10 text-bad' : 'border-accent bg-accent/10 text-accent')}
            style={{ left: sel.left, width: sel.width }}
          >
            {sel.width > 60 && (selection!.invalid ? 'Ocupado' : plural(sel.nights, 'noche', 'noches'))}
          </div>
        )}
      </div>
    </div>
  );
});

function HoverCard({ hover, guests }: { hover: Hover; guests: Map<ID, Guest> }) {
  const left = Math.min(hover.x + 12, window.innerWidth - 260);
  const top = Math.min(hover.y + 8, window.innerHeight - 120);
  const r = hover.reservation;
  const b = hover.block;
  return (
    <div className="pointer-events-none fixed z-40 w-60 animate-fade rounded-lg border border-line bg-surface px-3 py-2.5 text-xs shadow-pop" style={{ left, top }}>
      {r && (
        <>
          <p className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink"><span className="truncate">{guestName(guests.get(r.guestId))}</span><span className="shrink-0 font-normal text-muted">{r.code}</span></p>
          <p className="mt-1 text-body">{fmtShort(r.checkIn)} → {fmtShort(r.checkOut)} · {plural(nights(r), 'noche', 'noches')}</p>
          <p className="mt-1 flex items-center justify-between text-muted"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: CHANNEL[r.channel].color }} />{CHANNEL[r.channel].label} · {RES_STATUS[r.status].label}</span><span className="font-medium text-ink tnum">{money(totalOf(r.breakdown), r.currency)}</span></p>
        </>
      )}
      {b && (
        <>
          <p className="text-[13px] font-semibold text-ink">Bloqueo · {BLOCK_TYPE[b.type]}</p>
          <p className="mt-1 text-body">{fmtShort(b.start)} → {fmtShort(b.end)}</p>
          {b.reason && <p className="mt-1 text-muted">{b.reason}</p>}
        </>
      )}
    </div>
  );
}
