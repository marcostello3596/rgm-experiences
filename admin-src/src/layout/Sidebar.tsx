import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useStore } from '@/store/useStore';
import { useToday } from '@/store/hooks';
import { canAccess } from '@/auth/session';
import { NAV } from './nav';

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sand">
        <svg viewBox="0 0 32 32" className="size-5" aria-hidden><path d="M4 22 11.5 13l4 4L20 9.5 28 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[19px] tracking-wide text-ink">RGM</span>
          <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.18em] text-muted">PMS · ADMINISTRACIÓN</span>
        </span>
      )}
    </span>
  );
}

export function Sidebar({ collapsed, onToggle, onNavigate, mobile }: { collapsed: boolean; onToggle?: () => void; onNavigate?: () => void; mobile?: boolean }) {
  const role = useStore((s) => s.session?.role ?? 'admin');
  const unread = useStore((s) => s.conversations.filter((c) => c.unread).length);
  const today = useToday();
  const dueTasks = useStore((s) => s.tasks.filter((t) => t.status !== 'done' && t.date <= today).length);
  const badge: Record<string, number> = { mensajes: unread, tareas: dueTasks };
  const items = NAV.filter((n) => canAccess(role, n.section));

  return (
    <div className={cn('flex h-full flex-col border-r border-line bg-surface transition-[width] duration-200', mobile ? 'w-72' : collapsed ? 'w-[60px]' : 'w-60')}>
      <div className={cn('flex h-14 shrink-0 items-center border-b border-line', collapsed ? 'justify-center' : 'px-4')}>
        <Logo compact={collapsed} />
      </div>
      <nav className="scroll-thin flex-1 overflow-y-auto px-2 py-3" aria-label="Secciones">
        {items.map((n, i) => (
          <div key={n.to}>
            {i > 0 && items[i - 1].group !== n.group && <div className="mx-2 my-2 border-t border-line" />}
            <NavLink
              to={n.to}
              end={n.to === '/'}
              onClick={onNavigate}
              data-tip={collapsed ? n.label : undefined}
              data-tip-pos="right"
              className={({ isActive }) => cn('group relative mb-0.5 flex h-9 items-center gap-2.5 rounded-lg text-[13.5px] font-medium transition-colors', collapsed ? 'justify-center' : 'px-2.5', isActive ? 'bg-accent-soft text-accent' : 'text-body hover:bg-black/[0.04] hover:text-ink')}
            >
              {({ isActive }) => (
                <>
                  <n.icon className={cn('size-[17px] shrink-0', isActive ? 'text-accent' : 'text-muted group-hover:text-ink')} strokeWidth={isActive ? 2.2 : 1.9} />
                  {!collapsed && <span className="truncate">{n.label}</span>}
                  {badge[n.section] > 0 && (
                    <span className={cn('rounded-full bg-accent text-[10px] font-semibold text-white tnum', collapsed ? 'absolute top-1 right-1.5 size-2 text-[0px]' : 'ml-auto px-1.5 py-px')}>{badge[n.section]}</span>
                  )}
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>
      {onToggle && (
        <button type="button" onClick={onToggle} className={cn('flex h-11 shrink-0 items-center gap-2.5 border-t border-line text-[13px] text-muted hover:text-ink', collapsed ? 'justify-center' : 'px-4')} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}>
          {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /> Contraer menú</>}
        </button>
      )}
    </div>
  );
}
