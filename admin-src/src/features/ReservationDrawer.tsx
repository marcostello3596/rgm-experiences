import { Link } from 'react-router-dom';
import { ArrowRight, Ban, CreditCard, Pencil } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLookup } from '@/store/hooks';
import { balanceOf, nights, paymentStatusOf } from '@/domain/reservations';
import { fmtDate, weekdayShort } from '@/lib/dates';
import { money, plural } from '@/lib/format';
import { PAY_METHOD } from '@/lib/labels';
import { Avatar, Button, DL } from '@/ui/primitives';
import { Drawer } from '@/ui/overlays';
import { ChannelBadge, PayBadge, PropertyPhoto, StatusBadge } from '@/ui/domain';
import { isLocked, LockedNotice, PriceBreakdown, useReservationActions } from './reservation-parts';
import { useUI } from './ui-store';

/** Panel lateral con el resumen de una reserva (se abre desde el calendario y el dashboard). */
export function ReservationDrawer() {
  const id = useUI((s) => s.drawerReservationId);
  const { closeDrawer, editReservation, openPayment } = useUI();
  const { reservations, payments } = useStore();
  const look = useLookup();
  const actions = useReservationActions();
  const r = id ? reservations.find((x) => x.id === id) : undefined;
  if (!r) return null;

  const guest = look.guest(r.guestId);
  const property = look.property(r.propertyId);
  const balance = balanceOf(r, payments);
  const mine = payments.filter((p) => p.reservationId === r.id).sort((a, b) => a.date.localeCompare(b.date));
  const editable = r.status !== 'cancelled' && !isLocked(r);
  const day = (d: string) => <span className="capitalize">{weekdayShort(d)} {fmtDate(d)}</span>;

  return (
    <Drawer
      open
      onClose={closeDrawer}
      title={<span className="flex items-center gap-2">{r.code}<StatusBadge status={r.status} /></span>}
      subtitle={<span className="flex flex-wrap items-center gap-2"><ChannelBadge channel={r.channel} /><PayBadge status={paymentStatusOf(r, payments)} /></span>}
      footer={
        <>
          {editable && <Button variant="ghost" icon={Ban} className="mr-auto text-bad" onClick={async () => { if (await actions.cancel(r)) closeDrawer(); }}>Cancelar</Button>}
          {editable && <Button icon={Pencil} onClick={() => editReservation(r.id)}>Editar</Button>}
          {r.status !== 'cancelled' && balance > 0.005 && <Button icon={CreditCard} onClick={() => openPayment(r.id)}>Registrar pago</Button>}
        </>
      }
    >
      <div className="space-y-5">
        <LockedNotice reservation={r} />
        <div className="flex items-center gap-3">
          <Avatar name={look.guestName(r.guestId)} size={44} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-ink">{look.guestName(r.guestId)}</p>
            <p className="truncate text-[13px] text-muted">{[guest?.country, guest?.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
          </div>
          {guest && <Link to={`/huespedes/${guest.id}`} onClick={closeDrawer} className="ml-auto shrink-0 text-xs font-medium text-accent hover:underline">Ver perfil</Link>}
        </div>

        <Link to={`/departamentos/${r.propertyId}`} onClick={closeDrawer} className="flex items-center gap-3 rounded-xl border border-line p-2.5 transition hover:border-line-strong">
          <PropertyPhoto property={property} className="size-12 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{look.propertyName(r.propertyId)}</p>
            <p className="truncate text-xs text-muted">{property?.address}</p>
          </div>
        </Link>

        <DL items={[
          ['Check-in', <>{day(r.checkIn)}<span className="ml-1 font-normal text-muted">{property?.checkInTime} h</span></>],
          ['Check-out', <>{day(r.checkOut)}<span className="ml-1 font-normal text-muted">{property?.checkOutTime} h</span></>],
          ['Noches', plural(nights(r), 'noche', 'noches')],
          ['Huéspedes', `${plural(r.adults, 'adulto', 'adultos')}${r.children ? ` · ${plural(r.children, 'niño', 'niños')}` : ''}`],
        ]} />

        <section>
          <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Importe</h3>
          <PriceBreakdown reservation={r} />
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Cobros</h3>
          {mine.length === 0 ? (
            <p className="text-[13px] text-muted">Todavía no hay pagos registrados.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {mine.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                  <span className="min-w-0"><span className="block text-ink">{PAY_METHOD[p.method]}</span><span className="block truncate text-xs text-muted">{fmtDate(p.date)}{p.note ? ` · ${p.note}` : ''}</span></span>
                  <span className="font-medium text-ink tnum">{money(p.amount, p.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {r.observations && (
          <section>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Observaciones</h3>
            <p className="text-sm text-body">{r.observations}</p>
          </section>
        )}

        <Link to={`/reservas/${r.id}`} onClick={closeDrawer} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-white transition-colors hover:bg-accent-hover">
          Ver reserva completa <ArrowRight className="size-4" />
        </Link>
      </div>
    </Drawer>
  );
}
