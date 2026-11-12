import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Plus, RotateCcw, Save, ShieldAlert, Trash2, UserPlus } from 'lucide-react';
import type { AdminUser, ChannelId, Currency, Settings, UserRole } from '@/types';
import { CHANNEL_IDS, CURRENCIES } from '@/types';
import { useStore } from '@/store/useStore';
import { useToday } from '@/store/hooks';
import { services } from '@/services';
import { fmtDate, fmtDateTime } from '@/lib/dates';
import { CHANNEL, CHANNEL_STATUS, ROLE } from '@/lib/labels';
import { uid } from '@/lib/cn';
import { Avatar, Badge, Button, Card, CardHeader, DL, Field, IconButton, Input, Notice, NumberInput, PageHeader, Select, Tabs, Textarea, Toggle } from '@/ui/primitives';
import { confirm } from '@/ui/overlays';

type Tab = 'negocio' | 'general' | 'moneda' | 'zona' | 'usuarios' | 'notificaciones' | 'canales' | 'politicas' | 'seguridad';
const TABS: { value: Tab; label: string }[] = [
  { value: 'negocio', label: 'Datos del negocio' }, { value: 'general', label: 'Preferencias generales' }, { value: 'moneda', label: 'Moneda' }, { value: 'zona', label: 'Zona horaria' },
  { value: 'usuarios', label: 'Usuarios' }, { value: 'notificaciones', label: 'Notificaciones' }, { value: 'canales', label: 'Canales' }, { value: 'politicas', label: 'Políticas de reservas' }, { value: 'seguridad', label: 'Seguridad' },
];
const TIMEZONES = ['America/Argentina/Mendoza', 'America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Santiago', 'America/Sao_Paulo', 'America/Montevideo', 'UTC'];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'negocio') as Tab;
  const { settings, channels, session, run, resetDemo } = useStore();
  const today = useToday();
  const [d, setD] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setD(settings), [settings]);
  const dirty = JSON.stringify(d) !== JSON.stringify(settings);
  const patch = <K extends keyof Settings>(k: K, v: Partial<Settings[K]>) => setD((x) => ({ ...x, [k]: { ...(x[k] as object), ...v } as Settings[K] }));

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    await run(() => services.settings.update(d), { success: 'Configuración guardada.' });
    setSaving(false);
  };
  const Section = ({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) => (
    <Card className="max-w-3xl">
      <CardHeader title={title} hint={hint} />
      {children}
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={() => setD(settings)} disabled={!dirty}>Descartar</Button>
        <Button variant="primary" type="submit" icon={Save} loading={saving} disabled={!dirty}>Guardar cambios</Button>
      </div>
    </Card>
  );

  return (
    <>
      <PageHeader title="Configuración" description="Preferencias del panel. Se guardan en este navegador mientras el sistema esté en modo demostración." />
      <Tabs className="mb-5" value={tab} onChange={(t) => setParams(t === 'negocio' ? {} : { tab: t }, { replace: true })} tabs={TABS} />
      <form onSubmit={save}>
        {tab === 'negocio' && Section({
          title: 'Datos del negocio', hint: 'Se usan en encabezados y, más adelante, en mensajes y comprobantes internos.',
          children: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre comercial"><Input value={d.business.name} onChange={(e) => patch('business', { name: e.target.value })} required /></Field>
              <Field label="Razón social" optional><Input value={d.business.legalName} onChange={(e) => patch('business', { legalName: e.target.value })} /></Field>
              <Field label="Email de contacto" optional><Input type="email" value={d.business.email} onChange={(e) => patch('business', { email: e.target.value })} /></Field>
              <Field label="Teléfono / WhatsApp"><Input value={d.business.phone} onChange={(e) => patch('business', { phone: e.target.value })} /></Field>
              <Field label="Dirección"><Input value={d.business.address} onChange={(e) => patch('business', { address: e.target.value })} /></Field>
              <Field label="Sitio web"><Input value={d.business.website} onChange={(e) => patch('business', { website: e.target.value })} /></Field>
            </div>
          ),
        })}

        {tab === 'general' && Section({
          title: 'Preferencias generales',
          children: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Idioma" hint="Por ahora el panel está sólo en español de Argentina."><Select value={d.general.language} disabled><option value="es-AR">Español (Argentina)</option></Select></Field>
              <Field label="Formato de fecha" hint={`Ejemplo: ${fmtDate(today)}`}><Select value={d.general.dateFormat} disabled><option>dd/MM/yyyy</option></Select></Field>
              <Field label="La semana empieza el"><Select value={d.general.weekStart} onChange={(e) => patch('general', { weekStart: e.target.value as Settings['general']['weekStart'] })}><option value="monday">Lunes</option><option value="sunday">Domingo</option></Select></Field>
              <Field label="Vista inicial del calendario"><Select value={d.general.defaultCalendarDays} onChange={(e) => patch('general', { defaultCalendarDays: Number(e.target.value) as 7 | 14 | 30 })}><option value={7}>7 días</option><option value={14}>14 días</option><option value={30}>30 días</option></Select></Field>
            </div>
          ),
        })}

        {tab === 'moneda' && Section({
          title: 'Moneda', hint: 'Cada reserva y cada gasto conserva su moneda original. Esto define cómo se muestran los totales.',
          children: (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Moneda de los indicadores"><Select value={d.currency.reporting} onChange={(e) => patch('currency', { reporting: e.target.value as Currency })}>{CURRENCIES.map((c) => <option key={c} value={c}>{c === 'USD' ? 'USD · Dólar estadounidense' : 'ARS · Peso argentino'}</option>)}</Select></Field>
                <Field label={<>Tipo de cambio <Badge tone="violet">Ficticio</Badge></>} hint="Cuántos ARS equivalen a 1 USD. No es una cotización real."><NumberInput value={d.currency.demoRate} onChange={(v) => patch('currency', { demoRate: v === '' ? 0 : v })} min={1} prefix="$" /></Field>
              </div>
              <Toggle checked={d.currency.convert} onChange={(v) => patch('currency', { convert: v })} label="Convertir la otra moneda en los totales" description="Apagado (recomendado): los importes en otra moneda no se suman. Prendido: se convierten con el tipo de cambio ficticio y cada total lo aclara." />
            </div>
          ),
        })}

        {tab === 'zona' && Section({
          title: 'Zona horaria', hint: 'Define qué día es "hoy" para llegadas, salidas y tareas, y cómo se muestran las horas.',
          children: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Zona horaria"><Select value={d.timezone} onChange={(e) => setD({ ...d, timezone: e.target.value })}>{TIMEZONES.map((z) => <option key={z}>{z}</option>)}</Select></Field>
              <Field label="Fecha y hora en esa zona"><Input value={fmtDateTime(new Date().toISOString(), d.timezone)} readOnly disabled /></Field>
            </div>
          ),
        })}

        {tab === 'notificaciones' && Section({
          title: 'Notificaciones', hint: 'Qué avisos aparecen en la campana. En esta etapa no se envían emails ni mensajes.',
          children: (
            <div className="divide-y divide-line">
              {([['checkInToday', 'Check-ins y check-outs de hoy'], ['newReservation', 'Reservas pendientes de confirmar'], ['pendingPayment', 'Reservas con saldo pendiente'], ['cleaningPending', 'Limpiezas para hoy o atrasadas'], ['newMessage', 'Conversaciones sin leer'], ['cancellation', 'Cancelaciones (se activará con la integración)']] as [keyof Settings['notifications'], string][]).map(([k, label]) => (
                <Toggle key={k} checked={d.notifications[k]} onChange={(v) => patch('notifications', { [k]: v })} label={label} />
              ))}
            </div>
          ),
        })}

        {tab === 'politicas' && Section({
          title: 'Políticas de reservas', hint: 'Valores de referencia para el equipo. Los horarios de cada departamento se editan en su ficha.',
          children: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Seña para confirmar (%)"><NumberInput value={d.policies.depositPct} onChange={(v) => patch('policies', { depositPct: v === '' ? 0 : v })} min={0} max={100} prefix="%" /></Field>
              <Field label="Cancelación sin cargo hasta" hint="Días antes del check-in"><NumberInput value={d.policies.cancellationDays} onChange={(v) => patch('policies', { cancellationDays: v === '' ? 0 : v })} min={0} /></Field>
              <Field label="Check-in general"><Input type="time" value={d.policies.checkInTime} onChange={(e) => patch('policies', { checkInTime: e.target.value })} /></Field>
              <Field label="Check-out general"><Input type="time" value={d.policies.checkOutTime} onChange={(e) => patch('policies', { checkOutTime: e.target.value })} /></Field>
              <Field label="Normas de la casa" className="sm:col-span-2"><Textarea value={d.policies.houseRules} onChange={(e) => patch('policies', { houseRules: e.target.value })} rows={3} /></Field>
            </div>
          ),
        })}

        {tab === 'canales' && Section({
          title: 'Canales', hint: <>El estado de cada canal y el mapeo con Beds24 están en <Link to="/canales" className="font-medium text-accent hover:underline">Canales</Link>.</>,
          children: (
            <div className="space-y-5">
              <ul className="divide-y divide-line rounded-lg border border-line">
                {channels.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"><span className="font-medium text-ink">{c.name}</span><Badge tone={CHANNEL_STATUS[c.status].tone} dot>{CHANNEL_STATUS[c.status].label}</Badge></li>)}
              </ul>
              <div>
                <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">Comisiones por canal <Badge tone="violet">Ficticias</Badge></h4>
                <p className="mb-3 text-xs text-muted">Porcentaje sobre el alojamiento que el panel sugiere al cargar una reserva. No son las comisiones reales de ningún canal.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CHANNEL_IDS.map((c: ChannelId) => <Field key={c} label={CHANNEL[c].label}><NumberInput value={d.demoChannelFees[c]} onChange={(v) => patch('demoChannelFees', { [c]: v === '' ? 0 : v })} min={0} max={50} prefix="%" /></Field>)}
                </div>
              </div>
            </div>
          ),
        })}
      </form>

      {tab === 'usuarios' && <Users />}

      {tab === 'seguridad' && (
        <div className="max-w-3xl space-y-4">
          <Notice tone="amber" icon={ShieldAlert}>
            <strong>El panel todavía no tiene inicio de sesión.</strong> Cualquiera que abra la dirección /admin puede verlo. Como los datos son ficticios y se guardan en el navegador de cada persona, no se expone información real, pero no hay que cargar datos de huéspedes hasta protegerlo.
          </Notice>
          <Card>
            <CardHeader title="Estado del acceso" />
            <DL items={[['Sesión actual', session ? `${session.name} · ${ROLE[session.role].label}` : '—'], ['Inicio de sesión', session?.secured ? 'Activo' : 'No implementado'], ['Datos', services.mode === 'demo' ? 'Ficticios, en este navegador' : 'Reales'], ['Buscadores', 'La página pide no ser indexada (noindex)']]} />
            <h4 className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Antes de usarlo con datos reales</h4>
            <ul className="space-y-2">
              {[[false, 'Proteger /admin en el servidor: contraseña de Vercel o sesión con un proveedor de identidad'], [false, 'Usuarios reales con contraseña o acceso con Google, validados en el servidor'], [false, 'Permisos por rol aplicados también en el backend'], [true, 'Sin contraseñas ni claves de API en el código del navegador'], [true, 'Roles y secciones por rol ya definidos en la interfaz']].map(([ok, label]) => (
                <li key={String(label)} className="flex items-start gap-2.5 text-sm text-body">{ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-soft" />}{label}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Roles previstos" />
            <ul className="space-y-3">{(Object.keys(ROLE) as UserRole[]).map((r) => <li key={r}><p className="text-sm font-medium text-ink">{ROLE[r].label}</p><p className="text-[13px] text-muted">{ROLE[r].description}</p></li>)}</ul>
          </Card>
          {services.resetDemo && (
            <Card>
              <CardHeader title="Datos de demostración" hint="Vuelve a generar departamentos, reservas, pagos, gastos y mensajes ficticios alrededor de la fecha de hoy. Se pierden los cambios hechos en este navegador." />
              <Button icon={RotateCcw} onClick={async () => { if (await confirm({ title: 'Restablecer datos de demostración', message: 'Se borran todos los cambios que hiciste en este navegador.', confirmLabel: 'Restablecer' })) await resetDemo(); }}>Restablecer datos demo</Button>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function Users() {
  const { settings, session, run } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [staff, setStaff] = useState('');
  const saveUsers = (users: AdminUser[], success?: string) => run(() => services.settings.update({ users }), { success });
  const add = (e: FormEvent) => {
    e.preventDefault();
    void saveUsers([...settings.users, { id: uid('usr'), name: name.trim(), email: email.trim(), role, active: true }], 'Usuario agregado.');
    setName(''); setEmail('');
  };
  const remove = async (u: AdminUser) => {
    if (await confirm({ title: `Quitar a ${u.name}`, message: 'Se quita de la lista de usuarios.', confirmLabel: 'Quitar' })) void saveUsers(settings.users.filter((x) => x.id !== u.id), 'Usuario quitado.');
  };
  return (
    <div className="max-w-3xl space-y-4">
      <Notice tone="blue">Esta lista prepara los usuarios y sus roles. Todavía no pueden iniciar sesión: falta la autenticación real (ver Seguridad). No se guardan contraseñas.</Notice>
      <Card padded={false}>
        <CardHeader title="Usuarios del panel" className="mb-0 px-5 pt-5 pb-4" />
        <ul className="divide-y divide-line border-t border-line">
          {settings.users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <Avatar name={u.name} size={34} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{u.name}{u.id === session?.userId && <Badge className="ml-2">Sesión actual</Badge>}</p><p className="truncate text-xs text-muted">{u.email}</p></div>
              <Select aria-label={`Rol de ${u.name}`} value={u.role} disabled={u.id === session?.userId} onChange={(e) => void saveUsers(settings.users.map((x) => (x.id === u.id ? { ...x, role: e.target.value as UserRole } : x)), 'Rol actualizado.')} className="h-8 w-48 text-[13px]">{(Object.keys(ROLE) as UserRole[]).map((r) => <option key={r} value={r}>{ROLE[r].label}</option>)}</Select>
              <IconButton icon={Trash2} label="Quitar" tipPos="left" disabled={u.id === session?.userId} onClick={() => void remove(u)} />
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="grid gap-2 border-t border-line bg-subtle p-4 sm:grid-cols-[1fr_1fr_190px_auto]">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" aria-label="Nombre" required />
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" required />
          <Select aria-label="Rol" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>{(Object.keys(ROLE) as UserRole[]).map((r) => <option key={r} value={r}>{ROLE[r].label}</option>)}</Select>
          <Button variant="primary" type="submit" icon={UserPlus}>Agregar</Button>
        </form>
      </Card>
      <Card>
        <CardHeader title="Responsables de tareas" hint="Personas a las que se les asignan limpiezas y mantenimiento." />
        <div className="flex flex-wrap gap-1.5">
          {settings.staff.map((s) => <span key={s} className="inline-flex items-center gap-1 rounded-full bg-black/5 py-1 pr-1.5 pl-3 text-[13px] text-ink">{s}<button type="button" aria-label={`Quitar ${s}`} onClick={() => void run(() => services.settings.update({ staff: settings.staff.filter((x) => x !== s) }))} className="rounded-full p-0.5 text-muted hover:bg-black/10 hover:text-ink"><Trash2 className="size-3" /></button></span>)}
        </div>
        <form className="mt-3 flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); if (staff.trim() && !settings.staff.includes(staff.trim())) void run(() => services.settings.update({ staff: [...settings.staff, staff.trim()] })); setStaff(''); }}>
          <Input value={staff} onChange={(e) => setStaff(e.target.value)} placeholder="Ej.: Laura (limpieza)" aria-label="Nuevo responsable" />
          <Button type="submit" icon={Plus} disabled={!staff.trim()}>Agregar</Button>
        </form>
      </Card>
    </div>
  );
}
