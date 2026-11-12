import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, FlaskConical, Inbox, MailOpen, Mail, Pencil, Plus, Search, Send, Trash2 } from 'lucide-react';
import type { ChannelId, Conversation, MessageTemplate } from '@/types';
import { CHANNEL_IDS } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookup, useToday } from '@/store/hooks';
import { services } from '@/services';
import { fmtDate, fmtDateTime, fmtShort, fmtTime } from '@/lib/dates';
import { matches } from '@/lib/format';
import { CHANNEL } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { Avatar, Button, Card, EmptyState, Field, IconButton, Input, Notice, PageHeader, Select, Textarea } from '@/ui/primitives';
import { confirm, Modal, Popover } from '@/ui/overlays';
import { ChannelBadge } from '@/ui/domain';

export default function MessagesPage() {
  const { conversations, templates, reservations, propertyFilter, settings, run } = useStore();
  const look = useLookup();
  const today = useToday();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('c');
  const [q, setQ] = useState('');
  const [channel, setChannel] = useState<ChannelId | 'all'>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [draft, setDraft] = useState('');
  const [manage, setManage] = useState(false);
  const thread = useRef<HTMLDivElement>(null);
  const tz = settings.timezone;

  const list = useMemo(() => conversations.filter((c) => {
    if (propertyFilter !== 'all' && c.propertyId !== propertyFilter) return false;
    if (channel !== 'all' && c.channel !== channel) return false;
    if (onlyUnread && !c.unread) return false;
    return !q.trim() || matches(`${look.guestName(c.guestId)} ${look.propertyName(c.propertyId)} ${c.messages.map((m) => m.text).join(' ')}`, q);
  }).sort((a, b) => (b.messages.at(-1)?.at ?? '').localeCompare(a.messages.at(-1)?.at ?? '')), [conversations, propertyFilter, channel, onlyUnread, q, look]);

  const current = conversations.find((c) => c.id === selectedId) ?? null;
  const reservation = current?.reservationId ? reservations.find((r) => r.id === current.reservationId) : undefined;
  const unreadCount = conversations.filter((c) => c.unread).length;

  const open = (c: Conversation) => {
    setParams({ c: c.id }, { replace: true });
    setDraft('');
    if (c.unread) void run(() => services.messaging.markRead(c.id, true));
  };
  useEffect(() => { thread.current?.scrollTo({ top: thread.current.scrollHeight }); }, [current?.id, current?.messages.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!current || !draft.trim()) return;
    if (await run(() => services.messaging.send(current.id, draft))) setDraft('');
  };
  const fill = (t: MessageTemplate) => {
    const property = look.property(current?.propertyId);
    return t.text
      .replaceAll('{huesped}', look.guest(current?.guestId)?.firstName ?? 'huésped')
      .replaceAll('{departamento}', property?.publicName ?? 'el departamento')
      .replaceAll('{direccion}', property?.address ?? '')
      .replaceAll('{checkin}', reservation ? fmtDate(reservation.checkIn) : '(fecha de ingreso)')
      .replaceAll('{checkout}', reservation ? fmtDate(reservation.checkOut) : '(fecha de salida)');
  };
  const when = (iso: string) => (iso.slice(0, 10) === today ? fmtTime(iso, tz) : fmtShort(iso.slice(0, 10)));

  return (
    <>
      <PageHeader title="Mensajes" description={`${unreadCount} sin leer · ${conversations.length} conversaciones de prueba`} actions={<Button icon={FileText} onClick={() => setManage(true)}>Plantillas</Button>} />
      <Notice tone="violet" icon={FlaskConical} className="mb-4">Simulación local: las respuestas que escribas se guardan sólo en este navegador. <strong>No se envían</strong> a Airbnb, a Booking.com ni al huésped. La mensajería real llegará con la integración de Beds24.</Notice>

      <Card padded={false} className="grid overflow-hidden md:grid-cols-[340px_1fr]" >
        {/* Lista */}
        <div className={cn('flex min-h-0 min-w-0 flex-col border-line md:border-r', current && 'hidden md:flex')} style={{ height: 'max(420px, calc(100dvh - 268px))' }}>
          <div className="space-y-2 border-b border-line p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar conversaciones" aria-label="Buscar conversaciones" className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select aria-label="Canal" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className="h-8 text-[13px]"><option value="all">Todos los canales</option>{CHANNEL_IDS.map((c) => <option key={c} value={c}>{CHANNEL[c].label}</option>)}</Select>
              <Button size="sm" variant={onlyUnread ? 'primary' : 'secondary'} aria-pressed={onlyUnread} onClick={() => setOnlyUnread(!onlyUnread)}>Sin leer</Button>
            </div>
          </div>
          {list.length === 0 ? <EmptyState icon={Inbox} title="Sin conversaciones" description="Ninguna coincide con la búsqueda o los filtros." /> : (
            <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {list.map((c) => {
                const last = c.messages.at(-1);
                return (
                  <li key={c.id}>
                    <button type="button" onClick={() => open(c)} aria-current={c.id === selectedId} className={cn('flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-subtle', c.id === selectedId && 'bg-accent-soft/60 hover:bg-accent-soft/60')}>
                      <Avatar name={look.guestName(c.guestId)} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2"><span className={cn('truncate text-sm text-ink', c.unread ? 'font-semibold' : 'font-medium')}>{look.guestName(c.guestId)}</span><span className="shrink-0 text-[11px] text-muted tnum">{last && when(last.at)}</span></span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"><span className="size-1.5 shrink-0 rounded-full" style={{ background: CHANNEL[c.channel].color }} /><span className="truncate">{CHANNEL[c.channel].label} · {look.propertyName(c.propertyId)}</span></span>
                        <span className="mt-1 flex items-center gap-2"><span className={cn('min-w-0 flex-1 truncate text-[13px]', c.unread ? 'text-ink' : 'text-muted')}>{last?.from === 'host' && 'Vos: '}{last?.text}</span>{c.unread && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="Sin leer" />}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Conversación */}
        <div className={cn('flex min-h-0 min-w-0 flex-col', !current && 'hidden md:flex')} style={{ height: 'max(420px, calc(100dvh - 268px))' }}>
          {!current ? <EmptyState icon={Mail} title="Elegí una conversación" description="El historial aparece acá." className="flex-1" /> : (
            <>
              <header className="flex items-center gap-3 border-b border-line px-3 py-2.5 sm:px-4">
                <IconButton icon={ArrowLeft} label="Volver a la lista" onClick={() => setParams({}, { replace: true })} className="md:hidden" />
                <Avatar name={look.guestName(current.guestId)} size={36} />
                <div className="min-w-0 flex-1">
                  <Link to={`/huespedes/${current.guestId}`} className="block truncate text-sm font-semibold text-ink hover:underline">{look.guestName(current.guestId)}</Link>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted"><span className="truncate">{look.propertyName(current.propertyId)}</span>{reservation && <Link to={`/reservas/${reservation.id}`} className="text-accent hover:underline">{reservation.code} · {fmtShort(reservation.checkIn)} → {fmtShort(reservation.checkOut)}</Link>}</p>
                </div>
                <ChannelBadge channel={current.channel} className="hidden sm:inline-flex" />
                <IconButton icon={current.unread ? MailOpen : Mail} label={current.unread ? 'Marcar como leída' : 'Marcar como no leída'} tipPos="left" onClick={() => void run(() => services.messaging.markRead(current.id, current.unread))} />
              </header>
              <div ref={thread} className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto bg-subtle px-3 py-4 sm:px-5">
                {current.messages.map((m) => (
                  <div key={m.id} className={cn('flex', m.from === 'host' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-card', m.from === 'host' ? 'rounded-br-md bg-accent text-white' : 'rounded-bl-md border border-line bg-surface text-ink')}>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <p className={cn('mt-1 text-[11px]', m.from === 'host' ? 'text-white/70' : 'text-muted')}>{fmtDateTime(m.at, tz)}{m.simulated && ' · guardado localmente, no enviado'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="border-t border-line p-3">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void send(e); }} placeholder="Escribí una respuesta de prueba…" aria-label="Respuesta" rows={2} className="min-h-[60px] resize-none" />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Popover align="left" side="top" className="w-80 p-1.5" trigger={({ toggle }) => <Button size="sm" icon={FileText} onClick={toggle}>Plantillas</Button>}>
                    {(close) => (
                      <>
                        {templates.length === 0 && <p className="px-2.5 py-3 text-[13px] text-muted">No hay plantillas.</p>}
                        {templates.map((t) => <button key={t.id} type="button" onClick={() => { setDraft(fill(t)); close(); }} className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-black/[0.04]"><span className="block text-[13px] font-medium text-ink">{t.name}</span><span className="block truncate text-xs text-muted">{t.text}</span></button>)}
                        <button type="button" onClick={() => { close(); setManage(true); }} className="mt-1 block w-full border-t border-line px-2.5 pt-2 pb-1 text-left text-xs font-medium text-accent hover:underline">Administrar plantillas</button>
                      </>
                    )}
                  </Popover>
                  <span className="hidden text-[11px] text-muted sm:block">Ctrl + Enter para guardar</span>
                  <Button variant="primary" type="submit" icon={Send} disabled={!draft.trim()}>Guardar respuesta (simulada)</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </Card>
      {manage && <TemplatesModal onClose={() => setManage(false)} />}
    </>
  );
}

function TemplatesModal({ onClose }: { onClose: () => void }) {
  const { templates, run } = useStore();
  const [editing, setEditing] = useState<{ id?: string; name: string; text: string } | null>(null);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (await run(() => services.messaging.saveTemplate(editing), { success: 'Plantilla guardada.' })) setEditing(null);
  };
  const remove = async (t: MessageTemplate) => {
    if (await confirm({ title: `Eliminar "${t.name}"`, message: 'La plantilla se borra definitivamente.', confirmLabel: 'Eliminar' })) await run(() => services.messaging.removeTemplate(t.id));
  };
  return (
    <Modal open onClose={onClose} title="Plantillas de mensajes" description="Variables: {huesped}, {departamento}, {direccion}, {checkin}, {checkout}"
      footer={editing ? <><Button onClick={() => setEditing(null)}>Volver</Button><Button variant="primary" type="submit" form="tpl-form">Guardar plantilla</Button></> : <><Button onClick={onClose}>Cerrar</Button><Button variant="primary" icon={Plus} onClick={() => setEditing({ name: '', text: '' })}>Nueva plantilla</Button></>}>
      {editing ? (
        <form id="tpl-form" onSubmit={save} className="space-y-4">
          <Field label="Nombre"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required autoFocus /></Field>
          <Field label="Texto"><Textarea value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} rows={6} required /></Field>
        </form>
      ) : templates.length === 0 ? <EmptyState icon={FileText} title="Sin plantillas" /> : (
        <ul className="divide-y divide-line">
          {templates.map((t) => (
            <li key={t.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink">{t.name}</p><p className="mt-0.5 text-[13px] text-muted">{t.text}</p></div>
              <IconButton icon={Pencil} label="Editar" tipPos="top" onClick={() => setEditing(t)} /><IconButton icon={Trash2} label="Eliminar" tipPos="left" onClick={() => void remove(t)} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
