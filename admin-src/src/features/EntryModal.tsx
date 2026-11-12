import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, Ban, BedDouble, Sparkles, Trash2 } from 'lucide-react';
import type { BlockType, ChannelId, Currency, ReservationStatus } from '@/types';
import { CHANNEL_IDS, CURRENCIES } from '@/types';
import { useStore } from '@/store/useStore';
import { guestName, useToday } from '@/store/hooks';
import { services } from '@/services';
import { DomainError, findConflict, totalOf } from '@/domain/reservations';
import { indexRates, quoteStay } from '@/domain/pricing';
import { addDays, fmtDate, nightsBetween } from '@/lib/dates';
import { money, plural, SYMBOL } from '@/lib/format';
import { BLOCK_TYPE, CHANNEL, COUNTRIES, RES_STATUS } from '@/lib/labels';
import { Button, Field, Input, Notice, NumberInput, Segmented, Select, Textarea } from '@/ui/primitives';
import { confirm, Modal } from '@/ui/overlays';
import { useUI } from './ui-store';

type Num = number | '';
const n = (v: Num): number => (v === '' ? 0 : v);

/** Alta y edición de reservas y bloqueos. Se abre desde el calendario, la lista de reservas, el huésped, etc. */
export function EntryModal() {
  const entry = useUI((s) => s.entry);
  if (!entry) return null;
  return <EntryForm key={entry.reservationId ?? entry.blockId ?? 'new'} />;
}

function EntryForm() {
  const entry = useUI((s) => s.entry)!;
  const close = useUI((s) => s.closeEntry);
  const { properties, guests, reservations, blocks, rates, seasons, settings, run, propertyFilter } = useStore();
  const today = useToday();

  const editingRes = entry.reservationId ? reservations.find((r) => r.id === entry.reservationId) : undefined;
  const editingBlock = entry.blockId ? blocks.find((b) => b.id === entry.blockId) : undefined;
  const isEdit = Boolean(editingRes || editingBlock);
  const d = entry.defaults ?? {};
  const activeProps = properties.filter((p) => p.active || p.id === editingRes?.propertyId || p.id === editingBlock?.propertyId);

  const [kind, setKind] = useState<'reservation' | 'block'>(editingBlock ? 'block' : d.kind ?? 'reservation');
  const [propertyId, setPropertyId] = useState(editingRes?.propertyId ?? editingBlock?.propertyId ?? d.propertyId ?? (propertyFilter !== 'all' ? propertyFilter : activeProps[0]?.id ?? ''));
  const [checkIn, setCheckIn] = useState(editingRes?.checkIn ?? editingBlock?.start ?? d.checkIn ?? today);
  const [checkOut, setCheckOut] = useState(editingRes?.checkOut ?? editingBlock?.end ?? d.checkOut ?? addDays(d.checkIn ?? today, 2));

  // Reserva
  const [channel, setChannel] = useState<ChannelId>(editingRes?.channel ?? 'manual');
  const [status, setStatus] = useState<ReservationStatus>(editingRes?.status ?? 'confirmed');
  const [guestId, setGuestId] = useState<string>(editingRes?.guestId ?? d.guestId ?? 'new');
  const [guest, setGuest] = useState({ firstName: '', lastName: '', email: '', phone: '', country: 'Argentina' });
  const [adults, setAdults] = useState<Num>(editingRes?.adults ?? 2);
  const [children, setChildren] = useState<Num>(editingRes?.children ?? 0);
  const [currency, setCurrency] = useState<Currency>(editingRes?.currency ?? 'USD');
  const [accommodation, setAccommodation] = useState<Num>(editingRes?.breakdown.accommodation ?? '');
  const [cleaning, setCleaning] = useState<Num>(editingRes?.breakdown.cleaning ?? '');
  const [discount, setDiscount] = useState<Num>(editingRes?.breakdown.discount ?? 0);
  const [taxes, setTaxes] = useState<Num>(editingRes?.breakdown.taxes ?? 0);
  const [channelFee, setChannelFee] = useState<Num>(editingRes?.breakdown.channelFee ?? 0);
  const [observations, setObservations] = useState(editingRes?.observations ?? '');
  /** Mientras no se toquen los importes a mano, siguen la tarifa sugerida. */
  const [auto, setAuto] = useState(!editingRes);

  // Bloqueo
  const [blockType, setBlockType] = useState<BlockType>(editingBlock?.type ?? 'maintenance');
  const [reason, setReason] = useState(editingBlock?.reason ?? '');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const property = properties.find((p) => p.id === propertyId);
  const nights = nightsBetween(checkIn, checkOut);
  const rateIndex = useMemo(() => indexRates(rates), [rates]);
  const quote = useMemo(() => (property && nights > 0 ? quoteStay(property, checkIn, checkOut, rateIndex, seasons) : null), [property, checkIn, checkOut, nights, rateIndex, seasons]);

  /** Convierte la tarifa (en la moneda del departamento) a la moneda de la reserva con el tipo de cambio ficticio. */
  const conv = useMemo(() => {
    if (!property || property.currency === currency) return 1;
    return property.currency === 'USD' ? settings.currency.demoRate : 1 / settings.currency.demoRate;
  }, [property, currency, settings.currency.demoRate]);

  useEffect(() => {
    if (!auto || !quote) return;
    const acc = Math.round(quote.accommodation * conv);
    const disc = Math.round(quote.discount * conv);
    setAccommodation(acc);
    setCleaning(Math.round(quote.cleaning * conv));
    setDiscount(disc);
    setChannelFee(Math.round(((acc - disc) * settings.demoChannelFees[channel]) / 100));
  }, [auto, quote, conv, channel, settings.demoChannelFees]);

  const manual = <T,>(setter: (v: T) => void) => (v: T) => { setAuto(false); setter(v); };
  const breakdown = { accommodation: n(accommodation), cleaning: n(cleaning), discount: n(discount), taxes: n(taxes), channelFee: n(channelFee) };
  const total = totalOf(breakdown);

  const dateError = checkOut <= checkIn ? (kind === 'block' ? 'La fecha de fin tiene que ser posterior a la de inicio.' : 'El check-out tiene que ser posterior al check-in.') : null;
  const conflict = useMemo(() => {
    if (dateError || !propertyId || (kind === 'reservation' && status === 'cancelled')) return null;
    return findConflict({ propertyId, start: checkIn, end: checkOut, ignoreReservationId: editingRes?.id, ignoreBlockId: editingBlock?.id }, reservations, blocks);
  }, [dateError, propertyId, kind, status, checkIn, checkOut, editingRes, editingBlock, reservations, blocks]);
  const conflictText = conflict?.kind === 'reservation'
    ? `Se superpone con la reserva ${conflict.reservation.code} (${fmtDate(conflict.reservation.checkIn)} al ${fmtDate(conflict.reservation.checkOut)}).`
    : conflict?.kind === 'block' ? `Fechas bloqueadas: ${conflict.block.reason || BLOCK_TYPE[conflict.block.type]} (${fmtDate(conflict.block.start)} al ${fmtDate(conflict.block.end)}).` : null;
  const capacityError = kind === 'reservation' && property && n(adults) + n(children) > property.capacity ? `${property.internalName} admite hasta ${property.capacity} huéspedes.` : null;
  const minStayWarn = kind === 'reservation' && quote && nights > 0 && nights < quote.minStay ? `La estadía mínima para esas fechas es de ${plural(quote.minStay, 'noche', 'noches')}. Podés guardar igual.` : null;
  const blocked = Boolean(dateError || conflictText || capacityError);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    setError(null);
    setSaving(true);
    try {
      if (kind === 'block') {
        const input = { propertyId, start: checkIn, end: checkOut, type: blockType, reason: reason.trim() };
        await run(() => (editingBlock ? services.availability.updateBlock(editingBlock.id, input) : services.availability.createBlock(input)), { rethrow: true, success: editingBlock ? 'Bloqueo actualizado.' : 'Fechas bloqueadas.' });
      } else {
        if (guestId === 'new' && !guest.firstName.trim()) throw new DomainError('Cargá el nombre del huésped.');
        await run(async () => {
          const gid = guestId === 'new' ? (await services.guests.create({ ...guest, firstName: guest.firstName.trim(), lastName: guest.lastName.trim(), preferences: [], notes: '' })).id : guestId;
          const input = { propertyId, unitId: property?.units[0]?.id, guestId: gid, channel, checkIn, checkOut, adults: n(adults), children: n(children), status, currency, breakdown, observations: observations.trim() };
          return editingRes ? services.reservations.update(editingRes.id, input) : services.reservations.create(input);
        }, { rethrow: true, success: editingRes ? `Reserva ${editingRes.code} actualizada.` : 'Reserva creada.' });
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async () => {
    if (!editingBlock) return;
    if (!(await confirm({ title: 'Eliminar bloqueo', message: `Las fechas del ${fmtDate(editingBlock.start)} al ${fmtDate(editingBlock.end)} van a quedar disponibles.`, confirmLabel: 'Eliminar bloqueo' }))) return;
    await run(() => services.availability.removeBlock(editingBlock.id), { success: 'Bloqueo eliminado.' });
    close();
  };

  const sortedGuests = useMemo(() => [...guests].sort((a, b) => guestName(a).localeCompare(guestName(b), 'es')), [guests]);
  const title = editingRes ? `Editar reserva ${editingRes.code}` : editingBlock ? 'Editar bloqueo' : kind === 'block' ? 'Nuevo bloqueo' : 'Nueva reserva';

  return (
    <Modal
      open
      onClose={close}
      size={kind === 'block' ? 'md' : 'lg'}
      title={title}
      description={services.mode === 'demo' ? 'Se guarda sólo en este navegador (modo demostración).' : undefined}
      footer={
        <>
          {editingBlock && <Button variant="ghost" icon={Trash2} onClick={removeBlock} className="mr-auto text-bad">Eliminar</Button>}
          <Button onClick={close}>Cancelar</Button>
          <Button variant="primary" type="submit" form="entry-form" loading={saving} disabled={blocked}>{isEdit ? 'Guardar cambios' : kind === 'block' ? 'Bloquear fechas' : 'Crear reserva'}</Button>
        </>
      }
    >
      <form id="entry-form" onSubmit={submit} className="space-y-5">
        {!isEdit && (
          <Segmented value={kind} onChange={setKind} options={[{ value: 'reservation', label: 'Reserva', icon: BedDouble }, { value: 'block', label: 'Bloqueo', icon: Ban }]} />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Departamento" className="sm:col-span-1">
            <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
              {activeProps.map((p) => <option key={p.id} value={p.id}>{p.internalName}</option>)}
            </Select>
          </Field>
          <Field label={kind === 'block' ? 'Desde' : 'Check-in'}>
            <Input type="date" value={checkIn} required onChange={(e) => { const v = e.target.value; setCheckIn(v); if (v && checkOut <= v) setCheckOut(addDays(v, 1)); }} />
          </Field>
          <Field label={kind === 'block' ? 'Hasta (ese día queda libre)' : 'Check-out'} hint={nights > 0 ? plural(nights, 'noche', 'noches') : undefined} error={dateError}>
            <Input type="date" value={checkOut} min={addDays(checkIn, 1)} required invalid={Boolean(dateError)} onChange={(e) => setCheckOut(e.target.value)} />
          </Field>
        </div>

        {conflictText && <Notice tone="red" icon={AlertCircle}>{conflictText} El día de salida de una reserva sí puede coincidir con la entrada de otra.</Notice>}

        {kind === 'block' ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Motivo">
              <Select value={blockType} onChange={(e) => setBlockType(e.target.value as BlockType)}>
                {(Object.keys(BLOCK_TYPE) as BlockType[]).map((t) => <option key={t} value={t}>{BLOCK_TYPE[t]}</option>)}
              </Select>
            </Field>
            <Field label="Detalle" optional className="sm:col-span-2">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: pintura del living" maxLength={80} />
            </Field>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Canal">
                <Select value={channel} onChange={(e) => setChannel(e.target.value as ChannelId)}>
                  {CHANNEL_IDS.map((c) => <option key={c} value={c}>{CHANNEL[c].label}</option>)}
                </Select>
              </Field>
              <Field label="Estado">
                <Select value={status} onChange={(e) => setStatus(e.target.value as ReservationStatus)}>
                  {(isEdit ? (['confirmed', 'pending', 'completed', 'cancelled'] as const) : (['confirmed', 'pending'] as const)).map((s) => <option key={s} value={s}>{RES_STATUS[s].label}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Adultos"><NumberInput value={adults} onChange={setAdults} min={1} max={property?.capacity} step={1} /></Field>
                <Field label="Niños"><NumberInput value={children} onChange={setChildren} min={0} step={1} /></Field>
              </div>
            </div>
            {capacityError && <Notice tone="red" icon={AlertCircle}>{capacityError}</Notice>}

            <fieldset className="rounded-xl border border-line p-4">
              <legend className="px-1.5 text-xs font-semibold text-muted">Huésped</legend>
              <Field>
                <Select value={guestId} onChange={(e) => setGuestId(e.target.value)} aria-label="Huésped">
                  <option value="new">+ Nuevo huésped</option>
                  {sortedGuests.map((g) => <option key={g.id} value={g.id}>{guestName(g)} · {g.country}</option>)}
                </Select>
              </Field>
              {guestId === 'new' && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre"><Input value={guest.firstName} onChange={(e) => setGuest({ ...guest, firstName: e.target.value })} required autoComplete="off" /></Field>
                  <Field label="Apellido"><Input value={guest.lastName} onChange={(e) => setGuest({ ...guest, lastName: e.target.value })} autoComplete="off" /></Field>
                  <Field label="Email" optional><Input type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} autoComplete="off" /></Field>
                  <Field label="Teléfono" optional><Input type="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} autoComplete="off" /></Field>
                  <Field label="País">
                    <Select value={guest.country} onChange={(e) => setGuest({ ...guest, country: e.target.value })}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</Select>
                  </Field>
                </div>
              )}
            </fieldset>

            <fieldset className="rounded-xl border border-line p-4">
              <legend className="px-1.5 text-xs font-semibold text-muted">Importe</legend>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Segmented size="sm" value={currency} onChange={(c) => setCurrency(c)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
                {quote && (
                  <button type="button" onClick={() => setAuto(true)} disabled={auto} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline disabled:text-muted disabled:no-underline">
                    <Sparkles className="size-3.5" />
                    {auto ? 'Usando la tarifa sugerida' : `Usar tarifa sugerida (${money(Math.round(quote.accommodation * conv), currency)})`}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Field label="Alojamiento"><NumberInput value={accommodation} onChange={manual(setAccommodation)} min={0} prefix={SYMBOL[currency]} required /></Field>
                <Field label="Limpieza"><NumberInput value={cleaning} onChange={manual(setCleaning)} min={0} prefix={SYMBOL[currency]} /></Field>
                <Field label="Descuento"><NumberInput value={discount} onChange={manual(setDiscount)} min={0} prefix={SYMBOL[currency]} /></Field>
                <Field label="Impuestos"><NumberInput value={taxes} onChange={manual(setTaxes)} min={0} prefix={SYMBOL[currency]} /></Field>
                <Field label="Comisión canal"><NumberInput value={channelFee} onChange={manual(setChannelFee)} min={0} prefix={SYMBOL[currency]} /></Field>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3 text-sm">
                <span className="text-xs text-muted">
                  {quote?.discountLabel && auto ? `${quote.discountLabel}. ` : ''}
                  {conv !== 1 && auto ? `Tarifa convertida con el tipo de cambio ficticio (1 USD = ${settings.currency.demoRate.toLocaleString('es-AR')} ARS). ` : ''}
                  La comisión es un valor ficticio ({settings.demoChannelFees[channel]} % para {CHANNEL[channel].label}); no se le suma al huésped.
                </span>
                <span className="ml-auto text-muted">Total <strong className="ml-1 text-base text-ink tnum">{money(total, currency)}</strong></span>
              </div>
            </fieldset>

            {minStayWarn && <Notice tone="amber" icon={AlertCircle}>{minStayWarn}</Notice>}

            <Field label="Observaciones" optional>
              <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Horario de llegada, pedidos especiales…" rows={2} />
            </Field>
          </>
        )}

        {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
      </form>
    </Modal>
  );
}
