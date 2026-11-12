import { useState, type FormEvent } from 'react';
import type { Guest } from '@/types';
import { useStore } from '@/store/useStore';
import { services } from '@/services';
import { COUNTRIES } from '@/lib/labels';
import { Button, Field, Input, Select } from '@/ui/primitives';
import { Modal } from '@/ui/overlays';

export function GuestModal({ guest, onClose, onSaved }: { guest: Guest | null; onClose: () => void; onSaved?: (g: Guest) => void }) {
  const run = useStore((s) => s.run);
  const [f, setF] = useState({ firstName: guest?.firstName ?? '', lastName: guest?.lastName ?? '', email: guest?.email ?? '', phone: guest?.phone ?? '', country: guest?.country ?? 'Argentina', document: guest?.document ?? '' });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(), document: f.document.trim() || undefined };
    const saved = await run(() => (guest ? services.guests.update(guest.id, data) : services.guests.create({ ...data, preferences: [], notes: '' })), { success: guest ? 'Huésped actualizado.' : 'Huésped creado.' });
    setSaving(false);
    if (saved) { onSaved?.(saved); onClose(); }
  };
  const countries = COUNTRIES.includes(f.country) ? COUNTRIES : [f.country, ...COUNTRIES];
  return (
    <Modal open onClose={onClose} size="sm" title={guest ? 'Editar huésped' : 'Nuevo huésped'} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" type="submit" form="guest-form" loading={saving}>Guardar</Button></>}>
      <form id="guest-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre"><Input value={f.firstName} onChange={set('firstName')} required autoFocus autoComplete="off" /></Field>
        <Field label="Apellido"><Input value={f.lastName} onChange={set('lastName')} autoComplete="off" /></Field>
        <Field label="Email" optional className="sm:col-span-2"><Input type="email" value={f.email} onChange={set('email')} autoComplete="off" /></Field>
        <Field label="Teléfono" optional><Input type="tel" value={f.phone} onChange={set('phone')} autoComplete="off" /></Field>
        <Field label="País"><Select value={f.country} onChange={set('country')}>{countries.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Documento" optional className="sm:col-span-2"><Input value={f.document} onChange={set('document')} autoComplete="off" /></Field>
      </form>
    </Modal>
  );
}
