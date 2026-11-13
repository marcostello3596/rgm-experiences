import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Building2, CalendarRange, ImagePlus, Info, Plus, Save, Tags, Trash2, X } from 'lucide-react';
import type { ExternalIds, Property } from '@/types';
import { CURRENCIES } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookup, useMetricsSource, useMoneyView, useToday } from '@/store/hooks';
import { services } from '@/services';
import { rangeMetrics } from '@/domain/metrics';
import { fmtView } from '@/domain/money';
import { isActive, nights, totalOf } from '@/domain/reservations';
import { addMonths, endOfMonthExclusive, fmtDate, startOfMonth } from '@/lib/dates';
import { money, pct, plural, SYMBOL } from '@/lib/format';
import { AMENITIES } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { Badge, Button, Card, CardHeader, DL, EmptyState, Field, Input, Kpi, Notice, NumberInput, PageHeader, Select, Tabs, Textarea, Toggle } from '@/ui/primitives';
import { ChannelBadge, StatusBadge } from '@/ui/domain';
import { useUI } from '@/features/ui-store';

type Tab = 'resumen' | 'datos' | 'integraciones';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'resumen') as Tab;
  const { properties, reservations } = useStore();
  const p = properties.find((x) => x.id === id);
  const src = useMetricsSource();
  const view = useMoneyView();
  const today = useToday();
  const look = useLookup();
  const { newEntry, openDrawer } = useUI();

  const stats = useMemo(() => {
    if (!p) return null;
    const month = { start: startOfMonth(today), end: endOfMonthExclusive(today) };
    return { month: rangeMetrics(src, { range: month, propertyId: p.id }, view), next: rangeMetrics(src, { range: { start: month.end, end: addMonths(month.end, 1) }, propertyId: p.id }, view), quarter: rangeMetrics(src, { range: { start: addMonths(month.start, -2), end: month.end }, propertyId: p.id }, view) };
  }, [p, src, view, today]);

  if (!p || !stats) return <EmptyState icon={Building2} title="No encontramos ese departamento" action={<Link to="/departamentos" className="text-sm font-medium text-accent hover:underline">Volver a Departamentos</Link>} />;

  const upcoming = reservations.filter((r) => r.propertyId === p.id && isActive(r) && r.checkOut > today).sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 6);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Departamentos', to: '/departamentos' }, { label: p.internalName }]}
        title={<span className="flex flex-wrap items-center gap-2.5">{p.internalName}<Badge tone={p.active ? 'green' : 'gray'} dot>{p.active ? 'Activo' : 'Inactivo'}</Badge>{p.demo && <Badge tone="violet">Ficticio</Badge>}</span>}
        description={`${p.address} · ${p.city}`}
        actions={<><Link to="/tarifas" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 text-sm font-medium text-ink shadow-card hover:bg-subtle"><Tags className="size-4" />Tarifas</Link><Button variant="primary" icon={Plus} onClick={() => newEntry({ propertyId: p.id })} disabled={!p.active}>Nueva reserva</Button></>}
      />
      <Tabs className="mb-5" value={tab} onChange={(t) => setParams(t === 'resumen' ? {} : { tab: t }, { replace: true })} tabs={[{ value: 'resumen', label: 'Resumen' }, { value: 'datos', label: 'Datos y precios' }, { value: 'integraciones', label: 'Integraciones' }]} />

      {tab === 'resumen' && (
        <div className="space-y-4">
          {p.photos.length > 0 && (
            <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
              {p.photos.map((src0, i) => <img key={src0} src={src0} alt="" loading="lazy" className={cn('h-44 shrink-0 rounded-xl bg-sand object-cover', i === 0 ? 'w-72' : 'w-56')} />)}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Ocupación del mes" value={pct(stats.month.occupancy)} hint={`${stats.month.nightsSold} de ${stats.month.availableNights} noches`} />
            <Kpi label="Ocupación del mes próximo" value={pct(stats.next.occupancy)} hint={`${stats.next.nightsSold} noches reservadas`} />
            <Kpi label="Ingresos del mes" value={fmtView(stats.month.gross, view)} hint={`ADR ${fmtView(stats.month.adr, view)}`} />
            <Kpi label="Ingresos últimos 3 meses" value={fmtView(stats.quarter.gross, view)} hint={`Neto ${fmtView(stats.quarter.net, view)}`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card padded={false}>
              <CardHeader title="Próximas reservas" className="mb-0 px-5 pt-5" action={<Link to="/calendario" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"><CalendarRange className="size-3.5" />Calendario</Link>} />
              {upcoming.length === 0 ? <EmptyState icon={CalendarRange} title="Sin reservas próximas" /> : (
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {upcoming.map((r) => (
                    <li key={r.id}><button type="button" onClick={() => openDrawer(r.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-subtle">
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink">{look.guestName(r.guestId)}</span><span className="block text-xs text-muted">{fmtDate(r.checkIn)} al {fmtDate(r.checkOut)} · {plural(nights(r), 'noche', 'noches')}</span></span>
                      <ChannelBadge channel={r.channel} className="hidden sm:inline-flex" /><StatusBadge status={r.status} />
                      <span className="w-20 text-right font-medium text-ink tnum">{money(totalOf(r.breakdown), r.currency)}</span>
                    </button></li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <CardHeader title="Ficha" action={<button type="button" onClick={() => setParams({ tab: 'datos' })} className="text-xs font-medium text-accent hover:underline">Editar</button>} />
              <DL items={[
                ['Nombre público', p.publicName], ['Capacidad', plural(p.capacity, 'huésped', 'huéspedes')],
                ['Dormitorios', p.bedrooms === 0 ? 'Monoambiente' : String(p.bedrooms)], ['Camas / baños', `${p.beds} / ${p.bathrooms}`],
                ['Check-in / check-out', `${p.checkInTime} h / ${p.checkOutTime} h`], ['Estadía', `${p.minStay} a ${p.maxStay} noches`],
                ...(services.policy.seasonalPricing
                  ? ([['Precio base', money(p.basePrice, p.currency)], ['Fin de semana', money(p.weekendPrice ?? p.basePrice, p.currency)], ['Limpieza', money(p.cleaningFee, p.currency)], ['Descuentos', `${p.weeklyDiscount} % semanal · ${p.monthlyDiscount} % mensual`]] as [string, string][])
                  : ([['Precio de referencia', money(p.basePrice, p.currency)], ['Limpieza', money(p.cleaningFee, p.currency)]] as [string, string][])),
              ]} />
              {p.amenities.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">{p.amenities.map((a) => <Badge key={a}>{a}</Badge>)}</div>}
            </Card>
          </div>
        </div>
      )}
      {tab === 'datos' && <PropertyForm key={p.id} property={p} />}
      {tab === 'integraciones' && <IntegrationForm key={p.id} property={p} />}
    </>
  );
}

function PropertyForm({ property }: { property: Property }) {
  const run = useStore((s) => s.run);
  const [f, setF] = useState<Property>(property);
  const [photoUrl, setPhotoUrl] = useState('');
  const [amenity, setAmenity] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => setF(property), [property]);
  const set = <K extends keyof Property>(k: K, v: Property[K]) => setF((x) => ({ ...x, [k]: v }));
  const numField = (k: 'capacity' | 'bedrooms' | 'beds' | 'bathrooms' | 'basePrice' | 'cleaningFee' | 'minStay' | 'maxStay' | 'weeklyDiscount' | 'monthlyDiscount', extra?: { step?: number | string; min?: number; max?: number; prefix?: string }) =>
    <NumberInput value={f[k]} onChange={(v) => set(k, v === '' ? 0 : v)} min={extra?.min ?? 0} max={extra?.max} step={extra?.step ?? 1} prefix={extra?.prefix} />;
  const dirty = JSON.stringify(f) !== JSON.stringify(property);
  const sym = SYMBOL[f.currency];
  const movePhoto = (i: number, dir: -1 | 1) => { const a = [...f.photos]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set('photos', a); };
  const allAmenities = [...new Set([...AMENITIES, ...f.amenities])];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { id: _id, units: _units, ...patch } = f;
    await run(() => services.properties.update(property.id, patch), { success: 'Departamento guardado.' });
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-16">
      {services.policy.localPropertyFields.length > 0 && (
        <Notice tone="blue" icon={Info}>Nombre, dirección, horarios, capacidad, estadía y limpieza se guardan en {services.policy.sourceName}. Nombre público, descripción, fotos, comodidades, dormitorios, baños, precio de referencia y el estado activo se guardan sólo en este navegador.</Notice>
      )}
      <Card>
        <CardHeader title="Identificación" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre interno" hint="El que usa el equipo en el calendario."><Input value={f.internalName} onChange={(e) => set('internalName', e.target.value)} required /></Field>
          <Field label="Nombre público" hint="El que ve el huésped."><Input value={f.publicName} onChange={(e) => set('publicName', e.target.value)} /></Field>
          <Field label="Dirección"><Input value={f.address} onChange={(e) => set('address', e.target.value)} /></Field>
          <Field label="Ciudad o zona"><Input value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="Descripción" className="sm:col-span-2"><Textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} /></Field>
        </div>
        <div className="mt-2 border-t border-line pt-2">
          <Toggle checked={f.active} onChange={(v) => set('active', v)} label="Departamento activo" description="Los inactivos no aparecen en el calendario ni se pueden reservar, pero conservan su historial." />
        </div>
      </Card>

      <Card>
        <CardHeader title="Capacidad y horarios" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Capacidad">{numField('capacity', { min: 1 })}</Field>
          <Field label="Habitaciones" hint="0 = monoambiente">{numField('bedrooms')}</Field>
          <Field label="Camas">{numField('beds')}</Field>
          <Field label="Baños">{numField('bathrooms', { step: 0.5 })}</Field>
          <Field label="Check-in"><Input type="time" value={f.checkInTime} onChange={(e) => set('checkInTime', e.target.value)} /></Field>
          <Field label="Check-out"><Input type="time" value={f.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)} /></Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Precios" hint={services.policy.seasonalPricing ? 'Las tarifas por fecha y las temporadas se cargan en Tarifas y disponibilidad.' : 'Los precios por noche se cargan por fecha en Tarifas y disponibilidad (se guardan en Beds24). El precio de referencia sólo sugiere importes.'} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Moneda"><Select value={f.currency} onChange={(e) => set('currency', e.target.value as Property['currency'])}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label={services.policy.seasonalPricing ? 'Precio base' : 'Precio de referencia'}>{numField('basePrice', { min: 1, prefix: sym })}</Field>
          {services.policy.seasonalPricing && <Field label="Fin de semana" hint="Viernes y sábado"><NumberInput value={f.weekendPrice ?? ''} onChange={(v) => set('weekendPrice', v === '' ? undefined : v)} min={0} prefix={sym} placeholder={String(f.basePrice)} /></Field>}
          <Field label="Tarifa de limpieza">{numField('cleaningFee', { prefix: sym })}</Field>
          <Field label="Estadía mínima">{numField('minStay', { min: 1 })}</Field>
          <Field label="Estadía máxima">{numField('maxStay', { min: 1 })}</Field>
          {services.policy.seasonalPricing && <Field label="Descuento semanal (%)" hint="7 noches o más">{numField('weeklyDiscount', { max: 90 })}</Field>}
          {services.policy.seasonalPricing && <Field label="Descuento mensual (%)" hint="28 noches o más">{numField('monthlyDiscount', { max: 90 })}</Field>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Fotografías" hint="La primera es la portada. En esta etapa se cargan por dirección (URL); la subida de archivos llega con el backend." />
        {f.photos.length > 0 && (
          <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {f.photos.map((src, i) => (
              <li key={src + i} className="group relative overflow-hidden rounded-lg border border-line">
                <img src={src} alt="" loading="lazy" className="aspect-[4/3] w-full bg-sand object-cover" />
                {i === 0 && <Badge tone="wine" className="absolute top-1.5 left-1.5">Portada</Badge>}
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                  <button type="button" aria-label="Mover antes" onClick={() => movePhoto(i, -1)} disabled={i === 0} className="rounded bg-white/90 p-1 text-ink disabled:opacity-40"><ArrowUp className="size-3.5 -rotate-90" /></button>
                  <button type="button" aria-label="Mover después" onClick={() => movePhoto(i, 1)} disabled={i === f.photos.length - 1} className="rounded bg-white/90 p-1 text-ink disabled:opacity-40"><ArrowDown className="size-3.5 -rotate-90" /></button>
                  <button type="button" aria-label="Quitar foto" onClick={() => set('photos', f.photos.filter((_, k) => k !== i))} className="rounded bg-white/90 p-1 text-bad"><Trash2 className="size-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="/img/apts/…/01.jpg o https://…" aria-label="Dirección de la foto" />
          <Button icon={ImagePlus} onClick={() => { if (photoUrl.trim()) { set('photos', [...f.photos, photoUrl.trim()]); setPhotoUrl(''); } }} disabled={!photoUrl.trim()}>Agregar</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Comodidades" />
        <div className="flex flex-wrap gap-2">
          {allAmenities.map((a) => {
            const on = f.amenities.includes(a);
            return <button key={a} type="button" aria-pressed={on} onClick={() => set('amenities', on ? f.amenities.filter((x) => x !== a) : [...f.amenities, a])} className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[13px] font-medium transition', on ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-body hover:bg-subtle')}>{a}{on && <X className="size-3" />}</button>;
          })}
        </div>
        <div className="mt-3 flex max-w-sm gap-2">
          <Input value={amenity} onChange={(e) => setAmenity(e.target.value)} placeholder="Otra comodidad" aria-label="Otra comodidad" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (amenity.trim()) { set('amenities', [...new Set([...f.amenities, amenity.trim()])]); setAmenity(''); } } }} />
          <Button icon={Plus} onClick={() => { if (amenity.trim()) { set('amenities', [...new Set([...f.amenities, amenity.trim()])]); setAmenity(''); } }} disabled={!amenity.trim()}>Agregar</Button>
        </div>
      </Card>

      <div className={cn('sticky bottom-3 z-10 flex items-center justify-end gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-pop backdrop-blur transition', dirty ? 'opacity-100' : 'pointer-events-none opacity-0')}>
        <span className="mr-auto text-[13px] text-muted">Tenés cambios sin guardar.</span>
        <Button onClick={() => setF(property)}>Descartar</Button>
        <Button variant="primary" type="submit" icon={Save} loading={saving}>Guardar cambios</Button>
      </div>
    </form>
  );
}

const EXTERNAL_FIELDS: { key: keyof ExternalIds; label: string; hint: string }[] = [
  { key: 'beds24PropertyId', label: 'ID de propiedad en Beds24', hint: 'Identificador de la propiedad dentro de la cuenta de Beds24.' },
  { key: 'beds24RoomId', label: 'ID de habitación / unidad en Beds24', hint: 'La unidad vendible que corresponde a este departamento.' },
  { key: 'airbnbListingId', label: 'ID de anuncio en Airbnb', hint: 'El número del anuncio.' },
  { key: 'bookingPropertyId', label: 'ID de propiedad en Booking.com', hint: 'El identificador del alojamiento.' },
  { key: 'bookingRoomId', label: 'ID de habitación en Booking.com', hint: 'Sólo si el alojamiento tiene varias habitaciones.' },
  { key: 'roomTypeId', label: 'Tipo de habitación', hint: 'Cuando el canal lo pida.' },
  { key: 'ratePlanId', label: 'Plan tarifario', hint: 'Cuando el canal lo pida.' },
];

function IntegrationForm({ property }: { property: Property }) {
  const run = useStore((s) => s.run);
  const [ext, setExt] = useState<ExternalIds>(property.external);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(ext) !== JSON.stringify(property.external);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const clean = Object.fromEntries(Object.entries(ext).filter(([, v]) => v && String(v).trim())) as ExternalIds;
    await run(() => services.properties.update(property.id, { external: clean }), { success: 'Identificadores guardados.' });
    setSaving(false);
  };
  if (services.mode === 'live') {
    return (
      <div className="max-w-3xl space-y-4">
        <Notice tone="blue" icon={Info}>Este departamento es una habitación de Beds24. La conexión con Airbnb y Booking.com (y sus identificadores) se configura dentro de Beds24, en Canales.</Notice>
        <Card>
          <CardHeader title="Identificadores" />
          <DL items={[
            ['ID de propiedad en Beds24', <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">{property.external.beds24PropertyId}</code>],
            ['ID de habitación en Beds24', <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">{property.external.beds24RoomId}</code>],
            ['ID interno del panel', <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">{property.id}</code>],
          ]} />
        </Card>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="max-w-3xl space-y-4">
      <Notice tone="blue" icon={Info}>Estos identificadores todavía no se usan: no hay ninguna conexión con Beds24, Airbnb ni Booking.com. Se pueden ir cargando para que el mapeo esté listo cuando se haga la integración. Ninguno es obligatorio.</Notice>
      <Card>
        <CardHeader title="Identificadores" />
        <DL items={[['ID interno de la propiedad', <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">{property.id}</code>], ['ID interno de la unidad', <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">{property.units[0]?.id ?? '—'}</code>]]} />
        <p className="mt-2 text-xs text-muted">Los ID internos son fijos: no cambian aunque se conecten canales.</p>
        <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          {EXTERNAL_FIELDS.map((x) => (
            <Field key={x.key} label={x.label} hint={x.hint} optional>
              <Input value={ext[x.key] ?? ''} onChange={(e) => setExt({ ...ext, [x.key]: e.target.value })} autoComplete="off" spellCheck={false} />
            </Field>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
          <Button onClick={() => setExt(property.external)} disabled={!dirty}>Descartar</Button>
          <Button variant="primary" type="submit" icon={Save} loading={saving} disabled={!dirty}>Guardar</Button>
        </div>
      </Card>
    </form>
  );
}
