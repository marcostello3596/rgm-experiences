import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useStore } from '@/store/useStore';
import { Button, IconButton } from './primitives';

/** Capas abiertas, en orden. Escape sólo cierra la de más arriba. */
const stack: symbol[] = [];

/** Cierra con Escape y bloquea el scroll del fondo mientras haya una capa abierta. */
function useOverlay(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = Symbol('overlay');
    stack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(id), 1);
      if (stack.length === 0) document.body.style.overflow = '';
    };
  }, [open]);
}

const WIDTH = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' };

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; size?: keyof typeof WIDTH }) {
  useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-ink/40" onClick={onClose} />
      <div className={cn('relative flex max-h-[92dvh] w-full animate-pop flex-col rounded-t-2xl bg-surface shadow-pop sm:rounded-2xl', WIDTH[size])}>
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Cerrar" tipPos="left" onClick={onClose} className="-mt-1 -mr-2" />
        </header>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle px-5 py-3 sm:rounded-b-2xl">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 440 }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-ink/30" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full animate-slide flex-col bg-surface shadow-pop" style={{ maxWidth: width }}>
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-ink">{title}</h2>
            {subtitle && <div className="mt-1 text-[13px] text-muted">{subtitle}</div>}
          </div>
          <IconButton icon={X} label="Cerrar" tipPos="left" onClick={onClose} className="-mt-1 -mr-2" />
        </header>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle px-5 py-3">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}

/* ---------- Confirmación de acciones destructivas ---------- */

interface ConfirmOptions { title: string; message: ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean }
interface ConfirmState { current: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null }
const useConfirmStore = create<ConfirmState>(() => ({ current: null }));

/** `if (await confirm({...})) { ... }` */
export const confirm = (opts: ConfirmOptions): Promise<boolean> => new Promise((resolve) => useConfirmStore.setState({ current: { ...opts, resolve } }));

export function ConfirmHost() {
  const current = useConfirmStore((s) => s.current);
  const close = (ok: boolean) => {
    current?.resolve(ok);
    useConfirmStore.setState({ current: null });
  };
  if (!current) return null;
  return (
    <Modal
      open
      size="sm"
      onClose={() => close(false)}
      title={<span className="flex items-center gap-2">{current.danger !== false && <AlertTriangle className="size-4 text-bad" />}{current.title}</span>}
      footer={
        <>
          <Button onClick={() => close(false)}>{current.cancelLabel ?? 'Volver'}</Button>
          <Button variant={current.danger === false ? 'primary' : 'danger'} onClick={() => close(true)} autoFocus>{current.confirmLabel ?? 'Confirmar'}</Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-body">{current.message}</div>
    </Modal>
  );
}

/* ---------- Avisos ---------- */

const TOAST_ICON = { success: CheckCircle2, error: XCircle, info: Info };
const TOAST_COLOR = { success: 'text-ok', error: 'text-bad', info: 'text-info' };

export function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => {
        const Icon = TOAST_ICON[t.tone];
        return (
          <div key={t.id} role="status" className="pointer-events-auto flex max-w-md animate-up items-start gap-2.5 rounded-xl border border-line bg-surface py-2.5 pr-2 pl-3.5 text-sm text-ink shadow-pop">
            <Icon className={cn('mt-0.5 size-4 shrink-0', TOAST_COLOR[t.tone])} />
            <span className="min-w-0 flex-1">{t.text}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="rounded p-0.5 text-soft hover:text-ink"><X className="size-3.5" /></button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

/* ---------- Menú desplegable ---------- */

export function Popover({ trigger, children, align = 'right', side = 'bottom', className }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; side?: 'bottom' | 'top'; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={cn('absolute z-40 animate-pop rounded-xl border border-line bg-surface shadow-pop', side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2', align === 'right' ? 'right-0' : 'left-0', className)}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, onClick, danger, disabled }: { icon?: React.ComponentType<{ className?: string }>; children: ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-black/5 disabled:opacity-40', danger ? 'text-bad' : 'text-body')}>
      {Icon && <Icon className="size-4 shrink-0" />}
      {children}
    </button>
  );
}
