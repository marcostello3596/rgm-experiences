import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/labels';

/* ---------- Botones ---------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-card',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-subtle shadow-card',
  ghost: 'text-body hover:bg-black/5',
  danger: 'bg-bad text-white hover:brightness-110 shadow-card',
};
const SIZE: Record<Size, string> = { sm: 'h-8 px-2.5 text-[13px] gap-1.5', md: 'h-9 px-3.5 text-sm gap-2' };

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors disabled:opacity-50', VARIANT[variant], SIZE[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4" strokeWidth={2} /> : null}
      {children}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  tipPos?: 'top' | 'bottom' | 'left' | 'right';
  active?: boolean;
}

export function IconButton({ icon: Icon, label, tipPos = 'bottom', active, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-tip={label}
      data-tip-pos={tipPos}
      className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/5 hover:text-ink disabled:opacity-40', active && 'bg-black/5 text-ink', className)}
      {...rest}
    >
      <Icon className="size-4" />
    </button>
  );
}

/* ---------- Badges ---------- */

const TONE: Record<Tone, string> = {
  green: 'bg-ok-soft text-ok',
  amber: 'bg-warn-soft text-warn',
  red: 'bg-bad-soft text-bad',
  gray: 'bg-black/5 text-muted',
  blue: 'bg-info-soft text-info',
  violet: 'bg-violet-soft text-violet',
  wine: 'bg-accent-soft text-accent',
};

export function Badge({ tone = 'gray', children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap', TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------- Superficies ---------- */

export function Card({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <section className={cn('rounded-xl border border-line bg-surface shadow-card', padded && 'p-4 sm:p-5', className)}>{children}</section>;
}

export function CardHeader({ title, hint, action, className }: { title: ReactNode; hint?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <header className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}

export interface Crumb { label: string; to?: string }

export function PageHeader({ title, description, crumbs, actions }: { title: ReactNode; description?: ReactNode; crumbs?: Crumb[]; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {crumbs && (
          <nav aria-label="Ruta" className="mb-1 flex flex-wrap items-center gap-1 text-xs text-muted">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 text-soft" />}
                {c.to ? <Link to={c.to} className="hover:text-ink hover:underline">{c.label}</Link> : <span className="text-body">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Formularios ---------- */

const CONTROL = 'h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-soft focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-subtle disabled:text-muted';

/** Clases base del control, sin las que el llamador reemplaza (ancho, alto, tamaño de texto, relleno lateral). */
function control(className?: string): string {
  if (!className) return CONTROL;
  const drop = [/(^|\s)w-/.test(className) && 'w-full', /(^|\s)h-/.test(className) && 'h-9', /(^|\s)text-\[/.test(className) && 'text-sm', /(^|\s)pl-/.test(className) && 'px-3'].filter(Boolean);
  let base = CONTROL.split(' ').filter((c) => !drop.includes(c)).join(' ');
  if (drop.includes('px-3')) base += ' pr-3';
  return base;
}

export function Field({ label, hint, error, children, className, optional }: { label?: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string; optional?: boolean }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-body">
          {label}
          {optional && <span className="text-xs font-normal text-soft">opcional</span>}
        </span>
      )}
      {children}
      {error ? <span className="mt-1 block text-xs text-bad">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...rest }, ref) {
  return <input ref={ref} className={cn(control(className), invalid && 'border-bad focus:border-bad focus:ring-bad/15', className)} {...rest} />;
});

export function NumberInput({ value, onChange, prefix, className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'prefix'> & { value: number | ''; onChange: (v: number | '') => void; prefix?: string }) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className={cn(control(className), 'tnum', prefix && (prefix.length > 1 ? 'pl-11' : 'pl-7'), className)}
        {...rest}
      />
    </div>
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(control(className), 'appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23736b68' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control(className).replace('h-9 ', ''), 'min-h-20 py-2 leading-relaxed', className)} {...rest} />;
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-accent' : 'bg-line-strong')}
      >
        <span className={cn('absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </button>
    </div>
  );
}

export function Segmented<T extends string | number>({ value, onChange, options, size = 'md', className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; icon?: LucideIcon; tip?: string }[]; size?: Size; className?: string }) {
  return (
    <div role="tablist" className={cn('inline-flex rounded-lg border border-line bg-black/[0.035] p-0.5', className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="tab"
          type="button"
          aria-selected={o.value === value}
          aria-label={o.tip}
          data-tip={o.tip}
          data-tip-pos="bottom"
          onClick={() => onChange(o.value)}
          className={cn('inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition', size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-[13px]', o.value === value ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}
        >
          {o.icon && <o.icon className="size-3.5" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cn('scroll-thin flex gap-5 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={cn('-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors', t.value === value ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink')}
        >
          {t.label}
          {t.count != null && <span className="rounded-full bg-black/5 px-1.5 text-[11px] text-muted tnum">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Estados ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <Skeleton className="mb-5 h-8 w-56" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-black/[0.04] text-muted"><Icon className="size-5" /></span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({ tone = 'amber', icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-[13px] leading-snug', TONE[tone], className)}>
      {Icon && <Icon className="mt-px size-4 shrink-0" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ---------- Varios ---------- */

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 32% 91%)`, color: `hsl(${hue} 38% 30%)` }}
      aria-hidden
    >
      {letters}
    </span>
  );
}

export function Kpi({ label, value, hint, icon: Icon, tone, to }: { label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon; tone?: Tone; to?: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-medium text-muted">{label}</span>
        {Icon && <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', tone ? TONE[tone] : 'bg-black/[0.04] text-muted')}><Icon className="size-3.5" /></span>}
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-ink tnum">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = 'block rounded-xl border border-line bg-surface p-4 shadow-card';
  return to ? <Link to={to} className={cn(cls, 'transition hover:border-line-strong hover:shadow-pop')}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function DL({ items, cols = 2 }: { items: [label: string, value: ReactNode][]; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3.5', cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3')}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="mt-0.5 text-sm font-medium break-words text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
