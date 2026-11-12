import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './primitives';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Valor para ordenar. Sin esto la columna no se puede ordenar. */
  sort?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  className?: string;
  /** En celular: 'title' encabeza la tarjeta, 'hide' no se muestra. */
  mobile?: 'title' | 'hide';
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  pageSize?: number;
  dense?: boolean;
}

/** Tabla con orden por columna y paginado. En pantallas chicas cada fila se muestra como una tarjeta. */
export function DataTable<T>({ rows, columns, rowKey, onRowClick, empty, initialSort, pageSize = 15, dense }: Props<T>) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !col?.sort) return rows;
    const get = col.sort;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')) * dir;
    });
  }, [rows, columns, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = sorted.slice(current * pageSize, (current + 1) * pageSize);
  const toggle = (key: string) => { setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })); setPage(0); };
  const align = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  if (rows.length === 0) return <>{empty}</>;
  const title = columns.find((c) => c.mobile === 'title');

  return (
    <div>
      {/* Escritorio */}
      <div className="scroll-thin hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-3 py-2.5 text-xs font-medium whitespace-nowrap text-muted first:pl-5 last:pr-5', align(c.align))} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sort ? (
                    <button type="button" onClick={() => toggle(c.key)} className={cn('inline-flex items-center gap-1 hover:text-ink', sort?.key === c.key && 'text-ink')}>
                      {c.header}
                      {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn('border-b border-line/70 transition-colors last:border-0', onRowClick && 'cursor-pointer hover:bg-subtle')}>
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-3 first:pl-5 last:pr-5', dense ? 'py-2' : 'py-3', align(c.align), c.className)}>{c.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular */}
      <ul className="divide-y divide-line md:hidden">
        {visible.map((row) => (
          <li key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn('px-4 py-3', onRowClick && 'cursor-pointer active:bg-subtle')}>
            {title && <div className="mb-2 font-medium text-ink">{title.cell(row)}</div>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {columns.filter((c) => !c.mobile).map((c) => (
                <div key={c.key} className="min-w-0">
                  {c.header && <dt className="text-[11px] text-muted">{c.header}</dt>}
                  <dd className="text-[13px] text-ink">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5 text-xs text-muted">
          <span className="tnum">{current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} de {sorted.length}</span>
          <div className="flex items-center gap-1">
            <IconButton icon={ChevronLeft} label="Página anterior" tipPos="top" disabled={current === 0} onClick={() => setPage(current - 1)} />
            <span className="px-1 tnum">{current + 1} / {pages}</span>
            <IconButton icon={ChevronRight} label="Página siguiente" tipPos="left" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}
