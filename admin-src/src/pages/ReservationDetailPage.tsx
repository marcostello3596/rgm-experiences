import { useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Ban, CalendarRange, ClipboardList, CreditCard, History, Mail, MessageSquare, Pencil, Phone, StickyNote, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLookup } from '@/store/hooks';
import { services } from '@/services';
import { balanceOf, nights, paidOf, paymentStatusOf, totalOf } from '@/domain/reservations';
import { fmtDate, fmtDateTime, weekdayShort } from '@/lib/dates';
import { money, plural } from '@/lib/format';
import { PAY_METHOD } from '@/lib/labels';
import { Avatar, Button, Card, CardHeader, DL, EmptyState, IconButton, PageHeader, Tabs, Textarea } from '@/ui/primitives';
import { confirm } from '@/ui/overlays';
import { ChannelBadge, PayBadge, PropertyPhoto, StatusBadge } from '@/ui/domain';
import { PriceBreakdown, useReservationActions } from '@/features/reservation-parts';
import { useUI } from '@/features/ui-store';

type Tab = 'resumen' | 'huesped' | 'pagos' | 'historial' | 'notas';

export default function ReservationDetailPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'resumen') as Tab;
  const { reservations, payments, conversations, settings, session, run } = useStore();
  const look = useLookup();
  const { editReservation, openPayment } = useUI();
  const actions = useReservationActions();
  const [note, setNote] = useState('');
  const r = reservations.find((x) => x.id === id);

  if (!r) return <EmptyState icon={ClipboardList} title="No encontramos esa reserva" description="Puede que se haya eliminado." action={<Link to="/reservas" className="text-sm font-medium text-accent hover:underline">Volver a Reservas</Link>} />;

  const guest = look.guest(r.guestId);
  const property = look.property(r.propertyId);
  const mine = payments.filter((p) => p.reservationId === r.id).sort((a, b) => b.date.localeCompare(a.date));
  const balance = balanceOf(r, payments);
  const editable = r.status !== 'cancelled';
  const tz = settings.timezone;
  const conversation = conversations.find((c) => c.reservationId === r.id);
  const others = reservations.filter((x) => x.guestId === r.guestId && x.id !== r.id);
  const day = (d: string) => <span className="capitalize">{weekdayShort(d)} {fmtDate(d)}</span>;

  const addNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    if (await run(() => services.reservations.addNote(r.id, note, session?.name ?? 'Administrador'), { success: 'Nota agregada.' })) setNote('');
  };
  const removePayment = async (pid: string, label: string) => {
    if (await confirm({ title: 'Eliminar pago', message: `Se elimina el pago de ${label} y el saldo de la reserva vuelve a subir.`, confirmLabel: 'Eliminar pago' })) await run(() => services.payments.remove(pid), { success: 'Pago eliminado.' });
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Reservas', to: '/reservas' }, { label: r.code }]}
        title={<span className="flex flex-wrap items-center gap-2.5">{look.guestName(r.guestId)}<StatusBadge status={r.status} /><PayBadge status={paymentStatusOf(r, payments)} /></span>}
        description={<span className="flex flex-wrap items-center gap-2">{r.code} · {look.propertyName(r.propertyId)} · {fmtDate(r.checkIn)} al {fmtDate(r.checkOut)} <ChannelBadge channel={r.channel} /></span>}
        actions={
          <>
            <Button variant="ghost" icon={Trash2} className="text-bad" onClick={() => void actions.remove(r, '/reservas')}>Eliminar</Button>
            {editable && <Button icon={Ban} onClick={() => void actions.cancel(r)}>Cancelar</Button>}
            {editable && <Button icon={Pencil} onClick={() => editReservation(r.id)}>Editar</Button>}
            {editable && <Button variant="primary" icon={CreditCard} onClick={() => openPayment(r.id)} disabled={balance <= 0.005}>Registrar pago</Button>}
          </>
        }
      />

      <Tabs
        className="mb-5"
        value={tab}
        onChange={(t) => setParams(t === 'resumen' ? {} : { tab: t }, { replace: true })}
        tabs={[{ value: 'resumen', label: 'Resumen' }, { value: 'huesped', label: 'Huésped' }, { value: 'pagos', label: 'Pagos', count: mine.length }, { value: 'historial', label: 'Historial', count: r.history.length }, { value: 'notas', label: 'Notas', count: r.notes.length }]}
      />

      {tab === 'resumen' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader title="Estadía" action={<Link to="/calendario" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"><CalendarRange className="size-3.5" />Ver en el calendario</Link>} />
              <Link to={`/departamentos/${r.propertyId}`} className="mb-4 flex items-center gap-3 rounded-xl border border-line p-2.5 transition hover:border-line-strong">
                <PropertyPhoto property={property} className="size-14 shrink-0 rounded-lg" />
                <div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{look.propertyName(r.propertyId)}</p><p className="truncate text-xs text-muted">{property?.address} · {property?.city}</p></div>
              </Link>
              <DL cols={3} items={[
                ['Check-in', <>{day(r.checkIn)} <span className="font-normal text-muted">{property?.checkInTime} h</span></>],
                ['Check-out', <>{day(r.checkOut)} <span className="font-normal text-muted">{property?.checkOutTime} h</span></>],
                ['Noches', plural(nights(r), 'noche', 'noches')],
                ['Huéspedes', `${plural(r.adults, 'adulto', 'adultos')}${r.children ? ` · ${plural(r.children, 'niño', 'niños')}` : ''}`],
                ['Canal de origen', <ChannelBadge channel={r.channel} />],
                ['Creada', fmtDateTime(r.createdAt, tz)],
                ...(r.cancelledAt ? [['Cancelada', fmtDateTime(r.cancelledAt, tz)] as [string, string]] : []),
              ]} />
            </Card>
            <Card>
              <CardHeader title="Observaciones" />
              <p className="text-sm whitespace-pre-wrap text-body">{r.observations || <span className="text-muted">Sin observaciones.</span>}</p>
            </Card>
            {conversation && (
              <Link to={`/mensajes?c=${conversation.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-card transition hover:border-line-strong">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent"><MessageSquare className="size-4" /></span>
                <span className="min-w-0"><span className="block text-sm font-medium text-ink">Conversación con el huésped</span><span className="block truncate text-xs text-muted">{conversation.messages.at(-1)?.text}</span></span>
              </Link>
            )}
          </div>
          <Card className="self-start">
            <CardHeader title="Desglose del importe" hint={`Importes en ${r.currency}`} />
            <PriceBreakdown reservation={r} />
          </Card>
        </div>
      )}

      {tab === 'huesped' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={look.guestName(r.guestId)} size={52} />
              <div className="min-w-0"><p className="truncate text-base font-semibold text-ink">{look.guestName(r.guestId)}</p><p className="text-[13px] text-muted">{guest?.country}</p></div>
              {guest && <Link to={`/huespedes/${guest.id}`} className="ml-auto shrink-0 text-sm font-medium text-accent hover:underline">Ver perfil</Link>}
            </div>
            <DL cols={1} items={[
              ['Email', guest?.email ? <a href={`mailto:${guest.email}`} className="inline-flex items-center gap-1.5 hover:underline"><Mail className="size-3.5 text-muted" />{guest.email}</a> : '—'],
              ['Teléfono', guest?.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-muted" />{guest.phone}</span> : '—'],
              ['Preferencias', guest?.preferences.length ? guest.preferences.join(' · ') : '—'],
              ['Notas del huésped', guest?.notes || '—'],
            ]} />
          </Card>
          <Card padded={false}>
            <CardHeader title="Otras reservas de este huésped" className="mb-0 px-5 pt-5" />
            {others.length === 0 ? <p className="px-5 py-6 text-[13px] text-muted">Es su única reserva.</p> : (
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {others.map((o) => (
                  <li key={o.id}><Link to={`/reservas/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-subtle">
                    <span className="min-w-0"><span className="block font-medium text-ink">{o.code} · {look.propertyName(o.propertyId)}</span><span className="block text-xs text-muted">{fmtDate(o.checkIn)} al {fmtDate(o.checkOut)}</span></span>
                    <StatusBadge status={o.status} />
                  </Link></li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'pagos' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card padded={false}>
            <CardHeader title="Pagos registrados" hint="Registro interno: no cobra ni emite comprobantes." className="mb-0 px-5 pt-5" action={editable && <Button size="sm" icon={CreditCard} onClick={() => openPayment(r.id)} disabled={balance <= 0.005}>Registrar pago</Button>} />
            {mine.length === 0 ? <EmptyState icon={CreditCard} title="Sin pagos registrados" description={`El saldo pendiente es ${money(balance, r.currency)}.`} /> : (
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {mine.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <span className="min-w-0 flex-1"><span className="block font-medium text-ink">{PAY_METHOD[p.method]}</span><span className="block truncate text-xs text-muted">{fmtDate(p.date)}{p.note ? ` · ${p.note}` : ''}</span></span>
                    <span className="font-medium text-ink tnum">{money(p.amount, p.currency)}</span>
                    <IconButton icon={Trash2} label="Eliminar pago" tipPos="left" onClick={() => void removePayment(p.id, money(p.amount, p.currency))} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="self-start">
            <CardHeader title="Estado de cuenta" />
            <DL cols={1} items={[['Total', money(totalOf(r.breakdown), r.currency)], ['Pagado', money(paidOf(r.id, payments), r.currency)], ['Saldo pendiente', <span className={balance > 0.005 ? 'text-bad' : 'text-ok'}>{money(balance, r.currency)}</span>]]} />
          </Card>
        </div>
      )}

      {tab === 'historial' && (
        <Card>
          <CardHeader title="Historial de la reserva" />
          <ol className="relative ml-2 space-y-5 border-l border-line pl-6">
            {[...r.history].reverse().map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute top-1 -left-[29px] flex size-2.5 rounded-full bg-accent ring-4 ring-surface" />
                <p className="text-sm font-medium text-ink">{h.action}</p>
                {h.detail && <p className="text-[13px] text-body">{h.detail}</p>}
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><History className="size-3" />{fmtDateTime(h.at, tz)}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {tab === 'notas' && (
        <Card>
          <CardHeader title="Notas internas" hint="Sólo las ve el equipo. No se envían al huésped." />
          <form onSubmit={addNote} className="mb-5">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escribí una nota para el equipo…" rows={3} aria-label="Nueva nota" />
            <div className="mt-2 flex justify-end"><Button variant="primary" type="submit" icon={StickyNote} disabled={!note.trim()}>Agregar nota</Button></div>
          </form>
          {r.notes.length === 0 ? <p className="text-[13px] text-muted">Todavía no hay notas.</p> : (
            <ul className="space-y-3">
              {[...r.notes].reverse().map((n) => (
                <li key={n.id} className="group rounded-lg border border-line bg-subtle p-3">
                  <p className="text-sm whitespace-pre-wrap text-ink">{n.text}</p>
                  <p className="mt-1.5 flex items-center justify-between text-xs text-muted">
                    <span>{n.author} · {fmtDateTime(n.at, tz)}</span>
                    <button type="button" className="font-medium text-bad opacity-0 transition group-hover:opacity-100 focus:opacity-100" onClick={async () => { if (await confirm({ title: 'Eliminar nota', message: 'La nota se borra definitivamente.', confirmLabel: 'Eliminar' })) await run(() => services.reservations.removeNote(r.id, n.id)); }}>Eliminar</button>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
