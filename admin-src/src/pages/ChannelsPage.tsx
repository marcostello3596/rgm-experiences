import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Globe, Hand, Info, KeyRound, Network, RefreshCw, Save, ScrollText, Settings2, ShieldAlert, TriangleAlert } from 'lucide-react';
import type { Channel, ExternalIds, ID, SyncLogEntry } from '@/types';
import { useStore } from '@/store/useStore';
import { useToday } from '@/store/hooks';
import { services } from '@/services';
import { isActive } from '@/domain/reservations';
import { fmtDateTime } from '@/lib/dates';
import { plural } from '@/lib/format';
import { CHANNEL, CHANNEL_STATUS } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { Badge, Button, Card, DL, EmptyState, Input, Notice, PageHeader, Tabs } from '@/ui/primitives';
import { Modal } from '@/ui/overlays';

const LOOK: Record<Channel['id'], { color: string; mark: React.ReactNode }> = {
  airbnb: { color: CHANNEL.airbnb.color, mark: <span className="text-lg font-bold">A</span> },
  booking: { color: CHANNEL.booking.color, mark: <span className="text-lg font-bold">B.</span> },
  web: { color: CHANNEL.web.color, mark: <Globe className="size-5" /> },
  beds24: { color: '#3d1a22', mark: <Network className="size-5" /> },
  manual: { color: CHANNEL.manual.color, mark: <Hand className="size-5" /> },
};
const ORDER: Channel['id'][] = ['airbnb', 'booking', 'web', 'beds24', 'manual'];

export default function ChannelsPage() {
  const { channels, reservations, settings } = useStore();
  const today = useToday();
  const [open, setOpen] = useState<Channel['id'] | null>(null);
  const sorted = [...channels].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  const count = (id: Channel['id']) => (id === 'beds24' ? null : reservations.filter((r) => r.channel === id && isActive(r) && r.checkOut > today).length);
  const current = channels.find((c) => c.id === open);
  const live = services.mode === 'live';

  return (
    <>
      <PageHeader title="Canales" description={live ? 'De dónde llegan las reservas. Beds24 centraliza los canales: Airbnb y Booking.com se conectan dentro de Beds24.' : 'De dónde llegan las reservas. Hoy no hay ninguna conexión real: todo lo que ves en el panel es de demostración.'} />
      {live ? (
        <Notice tone="blue" icon={Info} className="mb-4">El panel lee y escribe en Beds24 a través del servidor. La credencial de Beds24 vive sólo en el servidor (variable de entorno) y nunca llega al navegador.</Notice>
      ) : (
        <Notice tone="amber" icon={ShieldAlert} className="mb-4">
          Ningún canal está conectado. La integración se hará desde un backend propio con Beds24 API V2; las claves nunca se cargan ni se guardan en este panel.
        </Notice>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((c) => {
          const n = count(c.id);
          const st = CHANNEL_STATUS[c.status];
          return (
            <Card key={c.id} className="flex flex-col">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: LOOK[c.id].color }}>{LOOK[c.id].mark}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-ink">{c.name}</h3>
                  <Badge tone={st.tone} dot className="mt-1">{st.label}</Badge>
                </div>
              </div>
              <p className="mt-3 flex-1 text-[13px] leading-relaxed text-body">{c.description}</p>
              <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs">
                {n !== null && <div className="flex justify-between gap-3"><dt className="text-muted">{live ? 'Reservas próximas' : 'Reservas próximas en la demo'}</dt><dd className="font-medium text-ink tnum">{n}</dd></div>}
                {(!live || c.id === 'beds24') &&                 <div className="flex justify-between gap-3"><dt className="text-muted">Última sincronización</dt><dd className="font-medium text-ink">{c.lastSyncAt && (c.status === 'connected' || c.status === 'error') ? fmtDateTime(c.lastSyncAt, settings.timezone) : c.id === 'beds24' || !live ? 'Nunca (sin conexión)' : 'A través de Beds24'}</dd></div>}
              </dl>
              <Button className="mt-4" icon={c.id === 'beds24' ? Settings2 : Info} onClick={() => setOpen(c.id)}>{c.id === 'beds24' ? 'Configuración' : 'Más información'}</Button>
            </Card>
          );
        })}
      </div>
      {current && (current.id === 'beds24' ? <Beds24Modal channel={current} onClose={() => setOpen(null)} /> : <InfoModal channel={current} onClose={() => setOpen(null)} />)}
    </>
  );
}

function InfoModal({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const properties = useStore((s) => s.properties);
  const key: keyof ExternalIds | null = channel.id === 'airbnb' ? 'airbnbListingId' : channel.id === 'booking' ? 'bookingPropertyId' : null;
  const mapped = key ? properties.filter((p) => p.external[key]).length : 0;
  const steps: Record<string, string[]> = {
    airbnb: ['Conectar la cuenta de Airbnb dentro de Beds24 (se hace en Beds24, no acá).', 'Cargar en cada departamento su ID de anuncio.', 'Activar la integración de Beds24 en el backend: las reservas de Airbnb empiezan a llegar por ahí.'],
    booking: ['Conectar el alojamiento de Booking.com dentro de Beds24.', 'Cargar en cada departamento su ID de propiedad (y de habitación, si corresponde).', 'Activar la integración de Beds24 en el backend.'],
    web: ['Hoy el sitio público deriva las consultas a WhatsApp: no crea reservas.', 'Las reservas con canal "Página web" de este panel son ficticias.', 'Para reservas directas reales hará falta un motor de reservas conectado al mismo inventario de Beds24.'],
    manual: ['Las reservas y los bloqueos que cargás desde Calendario o Reservas.', 'Con Beds24 activo, también se escribirán ahí para que los canales vean la disponibilidad real.'],
  };
  return (
    <Modal open onClose={onClose} title={channel.name} description={CHANNEL_STATUS[channel.status].label} footer={<Button onClick={onClose}>Cerrar</Button>}>
      <p className="text-sm leading-relaxed text-body">{channel.description}</p>
      <h4 className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Cómo va a funcionar</h4>
      <ol className="space-y-2.5">
        {(steps[channel.id] ?? []).map((s, i) => <li key={i} className="flex gap-3 text-sm text-body"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-[11px] font-semibold text-muted">{i + 1}</span>{s}</li>)}
      </ol>
      {key && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-line bg-subtle px-3.5 py-3 text-[13px]">
          <span className="text-body">{mapped === 0 ? 'Ningún departamento tiene cargado su identificador todavía.' : `${plural(mapped, 'departamento tiene', 'departamentos tienen')} el identificador cargado (de ${properties.length}).`}</span>
          <Link to="/departamentos" onClick={onClose} className="shrink-0 font-medium text-accent hover:underline">Ir a Departamentos</Link>
        </div>
      )}
    </Modal>
  );
}

type BTab = 'estado' | 'mapeo' | 'sync' | 'errores';

function Beds24Modal({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const live = services.mode === 'live';
  return live ? <Beds24Live channel={channel} onClose={onClose} /> : <Beds24Pending channel={channel} onClose={onClose} />;
}

function SyncLog({ entries, empty }: { entries: SyncLogEntry[]; empty: { title: string; description: string; icon: typeof ScrollText } }) {
  const tz = useStore((s) => s.settings.timezone);
  if (!entries.length) return <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />;
  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-3 px-3.5 py-2.5 text-[13px]">
          {e.result === 'ok' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-bad" />}
          <span className="min-w-0 flex-1 text-body">{e.detail}</span>
          <span className="shrink-0 text-xs text-muted tnum">{fmtDateTime(e.at, tz)}</span>
        </li>
      ))}
    </ul>
  );
}

function Beds24Live({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const { properties, sync, settings, syncNow, syncing, session } = useStore();
  const [tab, setTab] = useState<BTab>('estado');
  const status = sync.find((s) => s.channelId === 'beds24');
  const checks: [boolean, string][] = [
    [channel.status === 'connected', 'Credencial de Beds24 válida en el servidor'],
    [properties.length > 0, `Departamentos leídos de Beds24 (${properties.length})`],
    [Boolean(session?.secured), 'Panel protegido con contraseña'],
  ];
  return (
    <Modal open onClose={onClose} size="lg" title="Beds24" description={CHANNEL_STATUS[channel.status].label}
      footer={<><Button icon={RefreshCw} loading={syncing} onClick={() => void syncNow()}>Sincronizar ahora</Button><Button onClick={onClose}>Cerrar</Button></>}>
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'estado', label: 'Estado' }, { value: 'mapeo', label: 'Departamentos', count: properties.length }, { value: 'sync', label: 'Sincronizaciones', count: status?.log.length ?? 0 }, { value: 'errores', label: 'Errores', count: status?.errors.length ?? 0 }]} />
      {tab === 'estado' && (
        <div className="space-y-5">
          <DL items={[['Estado', <Badge tone={CHANNEL_STATUS[channel.status].tone} dot>{CHANNEL_STATUS[channel.status].label}</Badge>], ['Última lectura', channel.lastSyncAt ? fmtDateTime(channel.lastSyncAt, settings.timezone) : '—'], ['Fuente de verdad', 'Beds24: departamentos, reservas, bloqueos, precios, cobros y mensajes'], ['Actualización automática', 'Cada 5 minutos con el panel abierto']]} />
          <ul className="space-y-2">{checks.map(([ok, label]) => <li key={label} className="flex items-center gap-2.5 text-sm text-body">{ok ? <CheckCircle2 className="size-4 text-ok" /> : <CircleDashed className="size-4 text-soft" />}{label}</li>)}</ul>
          <Notice tone="blue" icon={Info}>Se guardan sólo en este navegador: {services.policy.localModules.join(', ')}.</Notice>
        </div>
      )}
      {tab === 'mapeo' && (
        <div className="scroll-thin overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="border-b border-line bg-subtle text-xs text-muted"><th className="px-3 py-2 text-left font-medium">Departamento</th><th className="px-3 py-2 text-left font-medium">Propiedad en Beds24</th><th className="px-3 py-2 text-left font-medium">Habitación en Beds24</th></tr></thead>
            <tbody>{properties.map((p) => <tr key={p.id} className="border-b border-line/70 last:border-0"><td className="px-3 py-2 font-medium text-ink">{p.internalName}</td><td className="px-3 py-2 tnum">{p.external.beds24PropertyId}</td><td className="px-3 py-2 tnum">{p.external.beds24RoomId}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {tab === 'sync' && <SyncLog entries={status?.log ?? []} empty={{ icon: ScrollText, title: 'Todavía no hubo lecturas', description: 'Cada lectura de Beds24 queda registrada acá.' }} />}
      {tab === 'errores' && <SyncLog entries={status?.errors ?? []} empty={{ icon: TriangleAlert, title: 'Sin errores registrados', description: 'Si una lectura de Beds24 falla, aparece acá con el motivo.' }} />}
    </Modal>
  );
}

function Beds24Pending({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const { properties, sync, run } = useStore();
  const [tab, setTab] = useState<BTab>('estado');
  const [draft, setDraft] = useState<Record<ID, { beds24PropertyId?: string; beds24RoomId?: string }>>({});
  const [saving, setSaving] = useState(false);
  const status = sync.find((s) => s.channelId === 'beds24');
  const mapped = properties.filter((p) => p.external.beds24PropertyId || p.external.beds24RoomId).length;
  const dirty = Object.keys(draft).length > 0;
  const val = (id: ID, k: 'beds24PropertyId' | 'beds24RoomId') => draft[id]?.[k] ?? properties.find((p) => p.id === id)?.external[k] ?? '';
  const change = (id: ID, k: 'beds24PropertyId' | 'beds24RoomId', v: string) => setDraft((d) => ({ ...d, [id]: { ...d[id], [k]: v } }));
  const save = async () => {
    setSaving(true);
    const ok = await run(async () => {
      for (const [id, patch] of Object.entries(draft)) {
        const p = properties.find((x) => x.id === id)!;
        const external = { ...p.external, ...patch } as ExternalIds;
        (Object.keys(external) as (keyof ExternalIds)[]).forEach((k) => { if (!external[k]?.trim()) delete external[k]; });
        await services.properties.update(id, { external });
      }
      return true;
    }, { success: 'Mapeo guardado.' });
    setSaving(false);
    if (ok) setDraft({});
  };
  const checks: [boolean, string][] = [
    [false, 'Backend con las credenciales de Beds24 (variables de entorno del servidor)'],
    [false, 'Implementación de los servicios contra ese backend'],
    [mapped === properties.length && properties.length > 0, `Mapeo de departamentos (${mapped} de ${properties.length})`],
    [false, 'Inicio de sesión real en /admin'],
  ];

  return (
    <Modal open onClose={onClose} size="lg" title="Beds24" description="Configuración de la integración (todavía no está activa)"
      footer={tab === 'mapeo' ? <><Button onClick={() => setDraft({})} disabled={!dirty}>Descartar</Button><Button variant="primary" icon={Save} onClick={save} loading={saving} disabled={!dirty}>Guardar mapeo</Button></> : <Button onClick={onClose}>Cerrar</Button>}>
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'estado', label: 'Estado' }, { value: 'mapeo', label: 'Mapeo de departamentos', count: mapped }, { value: 'sync', label: 'Sincronizaciones', count: status?.log.length ?? 0 }, { value: 'errores', label: 'Errores', count: status?.errors.length ?? 0 }]} />
      {tab === 'estado' && (
        <div className="space-y-5">
          <DL items={[['Estado de la integración', <Badge tone={CHANNEL_STATUS[channel.status].tone} dot>{CHANNEL_STATUS[channel.status].label}</Badge>], ['Última sincronización', 'Nunca (sin conexión)'], ['Fuente de verdad', 'Hoy: datos de demostración. Con la integración: Beds24.'], ['Modo del panel', 'Demostración']]} />
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Qué falta para activarla</h4>
            <ul className="space-y-2">
              {checks.map(([ok, label]) => <li key={label} className="flex items-center gap-2.5 text-sm text-body">{ok ? <CheckCircle2 className="size-4 text-ok" /> : <CircleDashed className="size-4 text-soft" />}{label}</li>)}
            </ul>
          </div>
          <Notice tone="amber" icon={KeyRound}>Acá no se piden ni se guardan claves de API. Las credenciales de Beds24 van sólo en el servidor; un navegador no debe verlas nunca.</Notice>
        </div>
      )}
      {tab === 'mapeo' && (
        <>
          <p className="mb-3 text-[13px] text-muted">Relacioná cada departamento con su propiedad y su habitación o unidad en Beds24.</p>
          <div className="scroll-thin overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b border-line bg-subtle text-xs text-muted"><th className="px-3 py-2 text-left font-medium">Departamento</th><th className="px-3 py-2 text-left font-medium">ID de propiedad</th><th className="px-3 py-2 text-left font-medium">ID de habitación / unidad</th></tr></thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.id} className="border-b border-line/70 last:border-0">
                    <td className="px-3 py-1.5"><span className="font-medium text-ink">{p.internalName}</span><span className="block text-[11px] text-muted">{p.id}</span></td>
                    {(['beds24PropertyId', 'beds24RoomId'] as const).map((k) => <td key={k} className="px-3 py-1.5"><Input aria-label={`${k} de ${p.internalName}`} value={val(p.id, k)} onChange={(e) => change(p.id, k, e.target.value)} placeholder="Sin cargar" className={cn('h-8 w-full', draft[p.id]?.[k] !== undefined && 'border-accent')} autoComplete="off" spellCheck={false} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === 'sync' && <EmptyState icon={ScrollText} title="Todavía no hubo sincronizaciones" description="Cuando la integración esté activa, acá vas a ver cada sincronización de reservas, disponibilidad y tarifas con su fecha y resultado." />}
      {tab === 'errores' && <EmptyState icon={TriangleAlert} title="Sin errores registrados" description="No hay conexión, así que no hay nada que pueda fallar todavía." />}
    </Modal>
  );
}
