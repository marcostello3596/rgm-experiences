import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bath, BedDouble, Building2, LayoutGrid, List, MapPin, Plus, Users } from 'lucide-react';
import type { Property } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookup, useMetricsSource, useToday } from '@/store/hooks';
import { services } from '@/services';
import { occupancyOf } from '@/domain/metrics';
import { isActive } from '@/domain/reservations';
import { endOfMonthExclusive, fmtShort, startOfMonth } from '@/lib/dates';
import { money, pct } from '@/lib/format';
import { Badge, Button, Card, EmptyState, Field, Input, NumberInput, PageHeader, Segmented } from '@/ui/primitives';
import { DataTable, type Column } from '@/ui/DataTable';
import { Modal } from '@/ui/overlays';
import { PropertyPhoto } from '@/ui/domain';

export default function PropertiesPage() {
  const { properties, reservations, propertyFilter } = useStore();
  const src = useMetricsSource();
  const look = useLookup();
  const today = useToday();
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [creating, setCreating] = useState(false);

  const month = useMemo(() => ({ start: startOfMonth(today), end: endOfMonthExclusive(today) }), [today]);
  const info = useMemo(() => new Map(properties.map((p) => {
    const next = reservations.filter((r) => r.propertyId === p.id && isActive(r) && r.checkOut > today).sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
    return [p.id, { occupancy: occupancyOf(src, p.id, month), next }];
  })), [properties, reservations, src, month, today]);
  const list = properties.filter((p) => propertyFilter === 'all' || p.id === propertyFilter);
  const nextText = (p: Property) => {
    const n = info.get(p.id)?.next;
    if (!n) return 'Sin reservas próximas';
    return n.checkIn <= today ? `Ocupado hasta el ${fmtShort(n.checkOut)} · ${look.guestName(n.guestId)}` : `${fmtShort(n.checkIn)} · ${look.guestName(n.guestId)}`;
  };
  const beds = (p: Property) => (p.bedrooms === 0 ? 'Monoambiente' : `${p.bedrooms} dorm.`);

  const columns: Column<Property>[] = [
    { key: 'name', header: 'Departamento', mobile: 'title', sort: (p) => p.internalName, cell: (p) => <span className="flex items-center gap-3"><PropertyPhoto property={p} className="size-9 shrink-0 rounded-lg" /><span className="min-w-0"><span className="block truncate font-medium text-ink">{p.internalName}</span><span className="block truncate text-xs font-normal text-muted">{p.address}</span></span></span> },
    { key: 'city', header: 'Ubicación', cell: (p) => p.city, sort: (p) => p.city },
    { key: 'cap', header: 'Capacidad', cell: (p) => <span className="tnum">{p.capacity}</span>, sort: (p) => p.capacity, align: 'right' },
    { key: 'rooms', header: 'Dorm. / baños', cell: (p) => <span className="tnum">{p.bedrooms || 'Mono'} / {p.bathrooms}</span>, align: 'right' },
    { key: 'price', header: 'Precio base', cell: (p) => <span className="tnum">{money(p.basePrice, p.currency)}</span>, sort: (p) => p.basePrice, align: 'right' },
    { key: 'occ', header: 'Ocupación del mes', cell: (p) => <span className="font-medium text-ink tnum">{pct(info.get(p.id)?.occupancy ?? 0)}</span>, sort: (p) => info.get(p.id)?.occupancy ?? 0, align: 'right' },
    { key: 'next', header: 'Próxima reserva', cell: (p) => <span className="text-[13px]">{nextText(p)}</span> },
    { key: 'status', header: 'Estado', cell: (p) => <Badge tone={p.active ? 'green' : 'gray'} dot>{p.active ? 'Activo' : 'Inactivo'}</Badge>, sort: (p) => (p.active ? 0 : 1) },
  ];

  return (
    <>
      <PageHeader
        title="Departamentos"
        description={`${properties.filter((p) => p.active).length} activos de ${properties.length}`}
        actions={
          <>
            <Segmented value={view} onChange={setView} options={[{ value: 'grid', label: 'Tarjetas', icon: LayoutGrid }, { value: 'table', label: 'Tabla', icon: List }]} />
            <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Nuevo departamento</Button>
          </>
        }
      />
      {list.length === 0 ? (
        <Card><EmptyState icon={Building2} title="No hay departamentos" action={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Nuevo departamento</Button>} /></Card>
      ) : view === 'table' ? (
        <Card padded={false}><DataTable rows={list} columns={columns} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/departamentos/${p.id}`)} initialSort={{ key: 'name', dir: 'asc' }} pageSize={20} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((p) => {
            const occ = info.get(p.id)?.occupancy ?? 0;
            return (
              <Link key={p.id} to={`/departamentos/${p.id}`} className="group overflow-hidden rounded-xl border border-line bg-surface shadow-card transition hover:border-line-strong hover:shadow-pop">
                <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                  <PropertyPhoto property={p} size="lg" className="size-full transition duration-500 group-hover:scale-[1.03]" />
                  <span className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <Badge tone={p.active ? 'green' : 'gray'} dot className="shadow-card">{p.active ? 'Activo' : 'Inactivo'}</Badge>
                    {p.demo && <Badge tone="violet" className="shadow-card">Ficticio</Badge>}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-ink">{p.internalName}</h3>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted"><MapPin className="size-3 shrink-0" />{p.address} · {p.city}</p>
                    </div>
                    <p className="shrink-0 text-right text-sm font-semibold text-ink tnum">{money(p.basePrice, p.currency)}<span className="block text-[11px] font-normal text-muted">por noche</span></p>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-body">
                    <li className="flex items-center gap-1.5"><Users className="size-3.5 text-muted" />{p.capacity} huésp.</li>
                    <li className="flex items-center gap-1.5"><BedDouble className="size-3.5 text-muted" />{beds(p)}</li>
                    <li className="flex items-center gap-1.5"><Bath className="size-3.5 text-muted" />{p.bathrooms} {p.bathrooms === 1 ? 'baño' : 'baños'}</li>
                  </ul>
                  <div className="mt-4 border-t border-line pt-3">
                    <div className="mb-1.5 flex items-baseline justify-between text-xs"><span className="text-muted">Ocupación del mes</span><span className="font-semibold text-ink tnum">{pct(occ)}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-accent" style={{ width: `${occ * 100}%` }} /></div>
                    <p className="mt-2.5 truncate text-xs text-muted"><span className="text-body">Próxima reserva:</span> {nextText(p)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {creating && <NewPropertyModal onClose={() => setCreating(false)} />}
    </>
  );
}

function NewPropertyModal({ onClose }: { onClose: () => void }) {
  const run = useStore((s) => s.run);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Ciudad de Mendoza');
  const [capacity, setCapacity] = useState<number | ''>(2);
  const [price, setPrice] = useState<number | ''>(40);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const created = await run(() => services.properties.create({
      internalName: name.trim(), publicName: name.trim(), description: '', address: address.trim(), city: city.trim(), capacity: capacity || 1, bedrooms: 1, beds: 1, bathrooms: 1,
      photos: [], amenities: [], checkInTime: '15:00', checkOutTime: '10:00', currency: 'USD', basePrice: price || 1, cleaningFee: 0, minStay: 1, maxStay: 60, weeklyDiscount: 0, monthlyDiscount: 0, active: true, external: {},
    }), { success: 'Departamento creado. Completá el resto de los datos.' });
    setSaving(false);
    if (created) { onClose(); navigate(`/departamentos/${created.id}?tab=datos`); }
  };

  return (
    <Modal open onClose={onClose} size="sm" title="Nuevo departamento" description="Lo básico para empezar. Después completás fotos, comodidades y precios."
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" type="submit" form="new-prop" loading={saving}>Crear departamento</Button></>}>
      <form id="new-prop" onSubmit={submit} className="space-y-4">
        <Field label="Nombre interno"><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ej.: Mitre III" /></Field>
        <Field label="Dirección"><Input value={address} onChange={(e) => setAddress(e.target.value)} required /></Field>
        <Field label="Ciudad o zona"><Input value={city} onChange={(e) => setCity(e.target.value)} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capacidad"><NumberInput value={capacity} onChange={setCapacity} min={1} step={1} required /></Field>
          <Field label="Precio base por noche"><NumberInput value={price} onChange={setPrice} min={1} prefix="US$" required /></Field>
        </div>
      </form>
    </Modal>
  );
}
