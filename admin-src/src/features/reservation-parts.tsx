import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import type { PaymentMethod, Reservation } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookup, useToday } from '@/store/hooks';
import { services } from '@/services';
import { balanceOf, netOf, paidOf, totalOf } from '@/domain/reservations';
import { fmtDate } from '@/lib/dates';
import { money, SYMBOL } from '@/lib/format';
import { CHANNEL, PAY_METHOD } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { Button, Field, Input, Notice, NumberInput, Select } from '@/ui/primitives';
import { confirm, Modal } from '@/ui/overlays';
import { useUI } from './ui-store';

/** Desglose del importe de una reserva. */
export function PriceBreakdown({ reservation: r, className }: { reservation: Reservation; className?: string }) {
  const payments = useStore((s) => s.payments);
  const demo = services.mode === 'demo';
  const b = r.breakdown;
  const paid = paidOf(r.id, payments);
  const balance = balanceOf(r, payments);
  const Row = ({ label, value, strong, muted, tone }: { label: string; value: string; strong?: boolean; muted?: boolean; tone?: 'bad' | 'ok' }) => (
    <div className={cn('flex items-baseline justify-between gap-4 py-1.5 text-sm', strong && 'font-semibold text-ink', muted && 'text-muted')}>
      <span>{label}</span>
      <span className={cn('tnum', tone === 'bad' && 'text-bad', tone === 'ok' && 'text-ok')}>{value}</span>
    </div>
  );
  return (
    <div className={className}>
      <Row label="Alojamiento" value={money(b.accommodation, r.currency)} />
      <Row label="Limpieza" value={money(b.cleaning, r.currency)} />
      {b.discount > 0 && <Row label="Descuentos" value={money(-b.discount, r.currency)} />}
      {b.taxes > 0 && <Row label="Impuestos" value={money(b.taxes, r.currency)} />}
      <div className="my-1 border-t border-line" />
      <Row label="Total del huésped" value={money(totalOf(b), r.currency)} strong />
      <Row label="Pagos registrados" value={money(paid, r.currency)} />
      <Row label="Saldo pendiente" value={money(balance, r.currency)} strong tone={balance > 0.005 ? 'bad' : 'ok'} />
      <div className="my-1 border-t border-dashed border-line" />
      <Row label={`Comisión de ${CHANNEL[r.channel].label}${demo ? ' (valor ficticio)' : ''}`} value={money(-b.channelFee, r.currency)} muted />
      <Row label="Neto para el anfitrión" value={money(netOf(b), r.currency)} muted />
    </div>
  );
}

/** Acciones sobre una reserva con su confirmación. */
export function useReservationActions() {
  const run = useStore((s) => s.run);
  const navigate = useNavigate();
  const look = useLookup();
  return {
    cancel: async (r: Reservation): Promise<boolean> => {
      const ok = await confirm({
        title: `Cancelar la reserva ${r.code}`,
        message: <>Se liberan las fechas del {fmtDate(r.checkIn)} al {fmtDate(r.checkOut)} en <strong>{look.propertyName(r.propertyId)}</strong>. La reserva queda en el historial como cancelada y los pagos registrados no se borran.</>,
        confirmLabel: 'Cancelar reserva',
      });
      if (!ok) return false;
      return (await run(() => services.reservations.cancel(r.id), { success: `Reserva ${r.code} cancelada.` })) !== null;
    },
    remove: async (r: Reservation, redirect?: string): Promise<boolean> => {
      const ok = await confirm({ title: `Eliminar la reserva ${r.code}`, message: 'Se borra definitivamente junto con sus pagos y notas. Esta acción no se puede deshacer.', confirmLabel: 'Eliminar' });
      if (!ok) return false;
      const done = (await run(async () => { await services.reservations.remove(r.id); return true; }, { success: `Reserva ${r.code} eliminada.` })) !== null;
      if (done && redirect) navigate(redirect);
      return done;
    },
  };
}

export function PaymentModal() {
  const id = useUI((s) => s.paymentReservationId);
  if (!id) return null;
  return <PaymentForm key={id} reservationId={id} />;
}

function PaymentForm({ reservationId }: { reservationId: string }) {
  const close = useUI((s) => s.closePayment);
  const { reservations, payments, run } = useStore();
  const today = useToday();
  const r = reservations.find((x) => x.id === reservationId);
  const balance = r ? balanceOf(r, payments) : 0;
  const [amount, setAmount] = useState<number | ''>(balance > 0 ? balance : '');
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  if (!r) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await run(() => services.payments.create({ reservationId: r.id, date, amount: amount === '' ? 0 : amount, currency: r.currency, method, note: note.trim() }), { rethrow: true, success: 'Pago registrado.' });
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="sm"
      onClose={close}
      title={`Registrar pago · ${r.code}`}
      description={`Saldo pendiente: ${money(balance, r.currency)}`}
      footer={<><Button onClick={close}>Cancelar</Button><Button variant="primary" type="submit" form="payment-form" loading={saving} disabled={balance <= 0.005}>Registrar pago</Button></>}
    >
      <form id="payment-form" onSubmit={submit} className="space-y-4">
        {balance <= 0.005 && <Notice tone="green">Esta reserva ya está pagada.</Notice>}
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Importe (${r.currency})`}><NumberInput value={amount} onChange={setAmount} min={0} step="0.01" prefix={SYMBOL[r.currency]} required autoFocus /></Field>
          <Field label="Fecha"><Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required /></Field>
        </div>
        <Field label="Medio de pago">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {(Object.keys(PAY_METHOD) as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAY_METHOD[m]}</option>)}
          </Select>
        </Field>
        <Field label="Nota" optional><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej.: seña 30 %" maxLength={80} /></Field>
        {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
        <p className="text-xs text-muted">Es un registro interno: no cobra ni genera comprobantes fiscales.</p>
      </form>
    </Modal>
  );
}
