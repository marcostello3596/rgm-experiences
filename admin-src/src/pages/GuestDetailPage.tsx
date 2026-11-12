import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarRange, Mail, Pencil, Phone, Plus, Save, Users, X } from 'lucide-react';
import type { Reservation } from '@/types';
import { useStore } from '@/store/useStore';
import { guestName, useLookup, useToday } from '@/store/hooks';
import { services } from '@/services';
import { guestStats } from '@/domain/guests';
import { balanceOf, nights, paymentStatusOf, totalOf } from '@/domain/reservations';
import { fmtDate, fmtDateTime } from '@/lib/dates';
import { money, plural } from '@/lib/format';
import { Avatar, Badge, Button, Card, CardHeader, DL, EmptyState, Input, Kpi, PageHeader, Textarea } from '@/ui/primitives';
import { ChannelBadge, PayBadge, StatusBadge } from '@/ui/domain';
import { GuestModal } from '@/features/GuestModal';
import { useUI } from '@/features/ui-store';
import { spentText } from './GuestsPage';

export default function GuestDetailPage() {
  const { id } = useParams();
  const { guests, reservations, payments, settings, run } = useStore();
  const look = useLookup();
  const today = useToday();
  const { newEntry } = useUI();
  const g = guests.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(g?.notes ?? '');
  const [pref, setPref] = useState('');
  useEffect(() => setNotes(g?.notes ?? ''), [g?.id, g?.notes]);
  const stats = useMemo(() => (g ? guestStats([g], reservations, payments, today).get(g.id)! : null), [g, reservations, payments, today]);

  if (!g || !stats) return <EmptyState icon={Users} title="No encontramos ese huésped" action={<Link to="/huespedes" className="text-sm font-medium text-accent hover:underline">Volver a Huéspedes</Link>} />;

  const mine = reservations.filter((r) => r.guestId === g.id).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const upcoming = mine.filter((r) => r.status !== 'cancelled' && r.checkOut > today).reverse();
  const past = mine.filter((r) => r.status === 'cancelled' || r.checkOut <= today);
  const name = guestName(g);
  const savePrefs = (preferences: string[]) => run(() => services.guests.update(g.id, { preferences }));

  const list = (items: Reservation[]) => (
    <ul className="divide-y divide-line border-t border-line">
      {items.map((r) => (
        <li key={r.id}><Link to={`/reservas/${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm hover:bg-subtle">
          <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink">{look.propertyName(r.propertyId)} <span className="font-normal text-muted">· {r.code}</span></span><span className="block text-xs text-muted">{fmtDate(r.checkIn)} al {fmtDate(r.checkOut)} · {plural(nights(r), 'noche', 'noches')}</span></span>
          <ChannelBadge channel={r.channel} className="hidden sm:inline-flex" /><StatusBadge status={r.status} />{r.status !== 'cancelled' && <PayBadge status={paymentStatusOf(r, payments)} />}
          <span className="w-24 text-right font-medium text-ink tnum">{money(totalOf(r.breakdown), r.currency)}</span>
        </Link></li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Huéspedes', to: '/huespedes' }, { label: name }]}
        title={<span className="flex items-center gap-3"><Avatar name={name} size={36} />{name}{stats.bookings > 1 && <Badge tone="wine">Recurrente</Badge>}</span>}
        description={`${g.country} · registrado el ${fmtDateTime(g.createdAt, settings.timezone).slice(0, 10)}`}
        actions={<><Button icon={Pencil} onClick={() => setEditing(true)}>Editar datos</Button><Button variant="primary" icon={Plus} onClick={() => newEntry({ guestId: g.id })}>Nueva reserva</Button></>}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Reservas" value={stats.bookings} hint={stats.cancelled ? `${stats.cancelled} cancelada${stats.cancelled > 1 ? 's' : ''}` : 'Sin cancelaciones'} />
        <Kpi label="Total histórico" value={spentText(stats.spent)} hint="Confirmadas y finalizadas" />
        <Kpi label="Última estadía" value={fmtDate(stats.lastStay)} hint={stats.nextStay ? `Próxima: ${fmtDate(stats.nextStay)}` : 'Sin reservas próximas'} />
        <Kpi label="Saldo pendiente" value={spentText(stats.owed)} tone={stats.owed.USD + stats.owed.ARS > 0 ? 'red' : undefined} hint={stats.owed.USD + stats.owed.ARS > 0 ? 'En reservas activas' : 'Está al día'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Datos personales" />
            <DL cols={1} items={[
              ['Email', g.email ? <a href={`mailto:${g.email}`} className="inline-flex items-center gap-1.5 hover:underline"><Mail className="size-3.5 text-muted" />{g.email}</a> : '—'],
              ['Teléfono', g.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-muted" />{g.phone}</span> : '—'],
              ['País', g.country], ['Documento', g.document || '—'],
            ]} />
          </Card>
          <Card>
            <CardHeader title="Preferencias" />
            <div className="flex flex-wrap gap-1.5">
              {g.preferences.length === 0 && <span className="text-[13px] text-muted">Sin preferencias cargadas.</span>}
              {g.preferences.map((p) => <span key={p} className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pr-1.5 pl-2.5 text-xs font-medium text-accent">{p}<button type="button" aria-label={`Quitar ${p}`} onClick={() => void savePrefs(g.preferences.filter((x) => x !== p))} className="rounded-full p-0.5 hover:bg-accent/10"><X className="size-3" /></button></span>)}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (pref.trim() && !g.preferences.includes(pref.trim())) void savePrefs([...g.preferences, pref.trim()]); setPref(''); }}>
              <Input value={pref} onChange={(e) => setPref(e.target.value)} placeholder="Ej.: llegada tarde, cuna…" aria-label="Nueva preferencia" maxLength={40} />
              <Button type="submit" icon={Plus} disabled={!pref.trim()}>Agregar</Button>
            </form>
          </Card>
          <Card>
            <CardHeader title="Notas internas" hint="Sólo las ve el equipo." />
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Datos útiles para próximas estadías…" aria-label="Notas internas" />
            <div className="mt-2 flex justify-end"><Button icon={Save} disabled={notes === g.notes} onClick={() => void run(() => services.guests.update(g.id, { notes }), { success: 'Notas guardadas.' })}>Guardar notas</Button></div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card padded={false}>
            <CardHeader title="Próximas reservas" className="mb-0 px-5 pt-5 pb-4" />
            {upcoming.length === 0 ? <EmptyState icon={CalendarRange} title="Sin reservas próximas" className="border-t border-line py-8" action={<Button icon={Plus} onClick={() => newEntry({ guestId: g.id })}>Nueva reserva</Button>} /> : list(upcoming)}
          </Card>
          <Card padded={false}>
            <CardHeader title="Estadías anteriores e historial" className="mb-0 px-5 pt-5 pb-4" />
            {past.length === 0 ? <p className="border-t border-line px-5 py-6 text-[13px] text-muted">Todavía no tiene estadías anteriores.</p> : list(past)}
          </Card>
          {mine.some((r) => balanceOf(r, payments) > 0.005 && r.status !== 'cancelled') && (
            <Card>
              <CardHeader title="Pagos pendientes" />
              <ul className="space-y-2 text-sm">
                {mine.filter((r) => balanceOf(r, payments) > 0.005 && r.status !== 'cancelled').map((r) => <li key={r.id} className="flex justify-between gap-3"><Link to={`/reservas/${r.id}?tab=pagos`} className="text-accent hover:underline">{r.code} · {look.propertyName(r.propertyId)}</Link><span className="font-medium text-bad tnum">{money(balanceOf(r, payments), r.currency)}</span></li>)}
              </ul>
            </Card>
          )}
        </div>
      </div>
      {editing && <GuestModal guest={g} onClose={() => setEditing(false)} />}
    </>
  );
}
