import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BedDouble, Building2, CalendarCheck, ClipboardList, ExternalLink, FlaskConical, LogOut, Menu, MessageSquare, RefreshCw, RotateCcw, Search, ShieldAlert, SprayCan, User, Wallet, type LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { guestName, useLookup, useToday } from '@/store/hooks';
import { services } from '@/services';
import { balanceOf, isActive } from '@/domain/reservations';
import { matches } from '@/lib/format';
import { fmtDateTime, fmtShort } from '@/lib/dates';
import { ROLE } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { Avatar, IconButton, Select } from '@/ui/primitives';
import { confirm, MenuItem, Popover } from '@/ui/overlays';
import { sectionFor } from './nav';

export function DemoBadge({ className }: { className?: string }) {
  const syncing = useStore((s) => s.syncing);
  const syncNow = useStore((s) => s.syncNow);
  const last = useStore((s) => s.sync.find((x) => x.channelId === 'beds24'));
  const tz = useStore((s) => s.settings.timezone);
  if (services.mode === 'live') {
    const error = last?.state === 'error';
    return (
      <button
        type="button"
        onClick={() => void syncNow()}
        disabled={syncing}
        data-tip={syncing ? 'Sincronizando…' : last?.lastSyncAt ? `Última lectura: ${fmtDateTime(last.lastSyncAt, tz)} · clic para actualizar` : 'Actualizar desde Beds24'}
        data-tip-pos="bottom"
        className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition hover:brightness-95', error ? 'border-bad/20 bg-bad-soft text-bad' : 'border-ok/20 bg-ok-soft text-ok', className)}
      >
        <RefreshCw className={cn('size-3.5', syncing && 'animate-spin')} />
        <span className="hidden xl:inline">{error ? 'Beds24 · error al sincronizar' : 'Conectado a Beds24'}</span>
        <span className="xl:hidden">Beds24</span>
      </button>
    );
  }
  return (
    <span data-tip="Nada de lo que ves es real ni se envía a ningún canal" data-tip-pos="bottom" className={cn('inline-flex items-center gap-1.5 rounded-full border border-violet/20 bg-violet-soft px-2.5 py-1 text-xs font-medium whitespace-nowrap text-violet', className)}>
      <FlaskConical className="size-3.5" />
      <span className="hidden xl:inline">Modo demostración — Datos ficticios</span>
      <span className="xl:hidden">Demo</span>
    </span>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { reservations, guests, properties } = useStore();
  const look = useLookup();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); }
    };
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, []);

  const results = useMemo(() => {
    const term = q.trim();
    if (term.length < 2) return [];
    const out: { icon: LucideIcon; title: string; sub: string; to: string }[] = [];
    for (const r of reservations) {
      if (out.length >= 5) break;
      if (matches(`${r.code} ${look.guestName(r.guestId)}`, term)) out.push({ icon: ClipboardList, title: `${r.code} · ${look.guestName(r.guestId)}`, sub: `${look.propertyName(r.propertyId)} · ${fmtShort(r.checkIn)} → ${fmtShort(r.checkOut)}`, to: `/reservas/${r.id}` });
    }
    guests.filter((g) => matches(`${guestName(g)} ${g.email} ${g.phone}`, term)).slice(0, 4).forEach((g) => out.push({ icon: User, title: guestName(g), sub: `${g.email} · ${g.country}`, to: `/huespedes/${g.id}` }));
    properties.filter((p) => matches(`${p.internalName} ${p.publicName} ${p.address}`, term)).slice(0, 4).forEach((p) => out.push({ icon: Building2, title: p.internalName, sub: p.address, to: `/departamentos/${p.id}` }));
    return out;
  }, [q, reservations, guests, properties, look]);

  const go = (to: string) => { navigate(to); setOpen(false); setQ(''); input.current?.blur(); };

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <input
        ref={input}
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0].to); if (e.key === 'Escape') { setOpen(false); input.current?.blur(); } }}
        placeholder="Buscar reservas, huéspedes, departamentos…"
        aria-label="Buscador global"
        className="h-9 w-full rounded-lg border border-line bg-bg pr-12 pl-9 text-sm text-ink outline-none transition placeholder:text-soft focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-px text-[10px] font-medium text-muted lg:block">Ctrl K</kbd>
      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 animate-pop overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-[13px] text-muted">Sin resultados para "{q.trim()}"</p>
          ) : results.map((r) => (
            <button key={r.to} type="button" onClick={() => go(r.to)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-black/[0.04]">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-muted"><r.icon className="size-4" /></span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">{r.title}</span>
                <span className="block truncate text-xs text-muted">{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { reservations, payments, tasks, conversations, settings } = useStore();
  const today = useToday();
  const n = settings.notifications;
  const items = useMemo(() => {
    const out: { icon: LucideIcon; text: string; to: string }[] = [];
    const arrivals = reservations.filter((r) => isActive(r) && r.checkIn === today).length;
    const departures = reservations.filter((r) => isActive(r) && r.checkOut === today).length;
    const owed = reservations.filter((r) => (r.status === 'confirmed' || r.status === 'pending') && balanceOf(r, payments) > 0.005).length;
    const cleaning = tasks.filter((t) => t.type === 'cleaning' && t.status !== 'done' && t.date <= today).length;
    const unread = conversations.filter((c) => c.unread).length;
    const toConfirm = reservations.filter((r) => r.status === 'pending').length;
    if (n.checkInToday && arrivals) out.push({ icon: CalendarCheck, text: `${arrivals} check-in${arrivals > 1 ? 's' : ''} hoy`, to: '/' });
    if (n.checkInToday && departures) out.push({ icon: BedDouble, text: `${departures} check-out${departures > 1 ? 's' : ''} hoy`, to: '/' });
    if (n.newReservation && toConfirm) out.push({ icon: ClipboardList, text: `${toConfirm} reserva${toConfirm > 1 ? 's' : ''} pendiente${toConfirm > 1 ? 's' : ''} de confirmar`, to: '/reservas?estado=pending' });
    if (n.pendingPayment && owed) out.push({ icon: Wallet, text: `${owed} reserva${owed > 1 ? 's' : ''} con saldo pendiente`, to: '/reservas?pago=pendiente' });
    if (n.cleaningPending && cleaning) out.push({ icon: SprayCan, text: `${cleaning} limpieza${cleaning > 1 ? 's' : ''} para hoy o atrasada${cleaning > 1 ? 's' : ''}`, to: '/tareas' });
    if (n.newMessage && unread) out.push({ icon: MessageSquare, text: `${unread} conversaci${unread > 1 ? 'ones' : 'ón'} sin leer`, to: '/mensajes' });
    return out;
  }, [reservations, payments, tasks, conversations, n, today]);

  return (
    <Popover
      className="w-80 p-1.5"
      trigger={({ toggle, open }) => (
        <span className="relative">
          <IconButton icon={Bell} label="Notificaciones" onClick={toggle} active={open} />
          {items.length > 0 && <span className="pointer-events-none absolute top-1 right-1 size-2 rounded-full bg-bad ring-2 ring-surface" />}
        </span>
      )}
    >
      {(close) => (
        <>
          <p className="px-2.5 pt-1.5 pb-2 text-xs font-semibold text-ink">Para atender</p>
          {items.length === 0 ? (
            <p className="px-2.5 pb-3 text-[13px] text-muted">No hay nada pendiente.</p>
          ) : items.map((it) => (
            <Link key={it.text} to={it.to} onClick={close} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-body hover:bg-black/[0.04]">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"><it.icon className="size-3.5" /></span>
              {it.text}
            </Link>
          ))}
          <p className="mt-1 border-t border-line px-2.5 pt-2 pb-1 text-[11px] text-muted">Se calculan con los datos del panel. Elegí cuáles ver en Configuración → Notificaciones.</p>
        </>
      )}
    </Popover>
  );
}

function Profile() {
  const session = useStore((s) => s.session);
  const resetDemo = useStore((s) => s.resetDemo);
  const syncNow = useStore((s) => s.syncNow);
  const signOut = useStore((s) => s.signOut);
  const navigate = useNavigate();
  if (!session) return null;
  return (
    <Popover
      className="w-72 p-1.5"
      trigger={({ toggle }) => (
        <button type="button" onClick={toggle} aria-label="Perfil" className="flex items-center gap-2 rounded-lg p-1 hover:bg-black/5">
          <Avatar name={session.name} size={28} />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar name={session.name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{session.name}</p>
              <p className="truncate text-xs text-muted">{ROLE[session.role].label}</p>
            </div>
          </div>
          {!session.secured && (
            <div className="mx-1 mb-1.5 flex items-start gap-2 rounded-lg bg-warn-soft px-2.5 py-2 text-xs leading-snug text-warn">
              <ShieldAlert className="mt-px size-3.5 shrink-0" />
              Sin inicio de sesión: el panel es una demo abierta. No cargues datos reales.
            </div>
          )}
          <div className="border-t border-line pt-1.5">
            <MenuItem icon={ShieldAlert} onClick={() => { close(); navigate('/configuracion?tab=seguridad'); }}>Seguridad y acceso</MenuItem>
            {services.resetDemo && (
              <MenuItem
                icon={RotateCcw}
                onClick={async () => {
                  close();
                  if (await confirm({ title: 'Restablecer datos de demostración', message: 'Se borran todos los cambios que hiciste en este navegador y se vuelven a generar los datos ficticios.', confirmLabel: 'Restablecer' })) await resetDemo();
                }}
              >
                Restablecer datos demo
              </MenuItem>
            )}
            {services.refresh && <MenuItem icon={RefreshCw} onClick={() => { close(); void syncNow(); }}>Sincronizar con Beds24</MenuItem>}
            <a href="/" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-body hover:bg-black/5"><ExternalLink className="size-4" />Ver el sitio público</a>
            {services.mode === 'live' && <MenuItem icon={LogOut} onClick={() => { close(); void signOut(); }}>Cerrar sesión</MenuItem>}
          </div>
        </>
      )}
    </Popover>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const section = sectionFor(pathname);
  const properties = useStore((s) => s.properties);
  const filter = useStore((s) => s.propertyFilter);
  const setFilter = useStore((s) => s.setPropertyFilter);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/90 px-3 backdrop-blur sm:px-5">
      <IconButton icon={Menu} label="Menú" onClick={onMenu} className="lg:hidden" />
      <h2 className="hidden shrink-0 text-[15px] font-semibold text-ink md:block">{section.label}</h2>
      <div className="flex min-w-0 flex-1 justify-start md:justify-center md:px-4"><GlobalSearch /></div>
      <span className="hidden sm:block"><DemoBadge /></span>
      <div className="relative hidden md:block">
        <Building2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" />
        <Select aria-label="Filtrar por departamento" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56 pl-8">
          <option value="all">Todos los departamentos</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.internalName}{p.active ? '' : ' (inactivo)'}</option>)}
        </Select>
      </div>
      <Notifications />
      <Profile />
    </header>
  );
}

/** Selector de departamento para pantallas chicas (la barra superior lo oculta). */
export function MobilePropertyFilter() {
  const properties = useStore((s) => s.properties);
  const filter = useStore((s) => s.propertyFilter);
  const setFilter = useStore((s) => s.setPropertyFilter);
  return (
    <div className="mb-3 flex items-center gap-2 md:hidden">
      <span className="sm:hidden"><DemoBadge /></span>
      <Select aria-label="Filtrar por departamento" value={filter} onChange={(e) => setFilter(e.target.value)} className="min-w-0 flex-1">
        <option value="all">Todos los departamentos</option>
        {properties.map((p) => <option key={p.id} value={p.id}>{p.internalName}</option>)}
      </Select>
    </div>
  );
}
