import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Search, Users } from 'lucide-react';
import type { Guest } from '@/types';
import { useStore } from '@/store/useStore';
import { guestName, useToday } from '@/store/hooks';
import { guestStats } from '@/domain/guests';
import { fmtDate } from '@/lib/dates';
import { matches, money, plural } from '@/lib/format';
import { downloadCSV } from '@/lib/csv';
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Select } from '@/ui/primitives';
import { DataTable, type Column } from '@/ui/DataTable';
import { GuestModal } from '@/features/GuestModal';

export const spentText = (s: { USD: number; ARS: number }): string => [s.USD > 0 && money(s.USD, 'USD'), s.ARS > 0 && money(s.ARS, 'ARS')].filter(Boolean).join(' + ') || '—';

export default function GuestsPage() {
  const { guests, reservations, payments } = useStore();
  const today = useToday();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('all');
  const [kind, setKind] = useState<'all' | 'upcoming' | 'repeat' | 'owes' | 'none'>('all');
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => guestStats(guests, reservations, payments, today), [guests, reservations, payments, today]);
  const countries = useMemo(() => [...new Set(guests.map((g) => g.country))].sort((a, b) => a.localeCompare(b, 'es')), [guests]);
  const rows = useMemo(() => guests.filter((g) => {
    const s = stats.get(g.id)!;
    if (country !== 'all' && g.country !== country) return false;
    if (kind === 'upcoming' && !s.nextStay) return false;
    if (kind === 'repeat' && s.bookings < 2) return false;
    if (kind === 'owes' && s.owed.USD + s.owed.ARS <= 0) return false;
    if (kind === 'none' && s.bookings > 0) return false;
    return !q.trim() || matches(`${guestName(g)} ${g.email} ${g.phone} ${g.document ?? ''}`, q);
  }), [guests, stats, country, kind, q]);

  const columns: Column<Guest>[] = [
    { key: 'name', header: 'Nombre', mobile: 'title', sort: (g) => guestName(g), cell: (g) => <span className="flex items-center gap-2.5"><Avatar name={guestName(g)} size={30} /><span className="font-medium text-ink">{guestName(g)}</span>{(stats.get(g.id)?.bookings ?? 0) > 1 && <Badge tone="wine">Recurrente</Badge>}</span> },
    { key: 'email', header: 'Email', cell: (g) => <span className="text-[13px]">{g.email || '—'}</span>, sort: (g) => g.email },
    { key: 'phone', header: 'Teléfono', cell: (g) => <span className="text-[13px] whitespace-nowrap tnum">{g.phone || '—'}</span> },
    { key: 'country', header: 'País', cell: (g) => g.country, sort: (g) => g.country },
    { key: 'bookings', header: 'Reservas', align: 'right', cell: (g) => <span className="tnum">{stats.get(g.id)?.bookings ?? 0}</span>, sort: (g) => stats.get(g.id)?.bookings ?? 0 },
    { key: 'last', header: 'Última estadía', cell: (g) => <span className="tnum">{fmtDate(stats.get(g.id)?.lastStay)}</span>, sort: (g) => stats.get(g.id)?.lastStay ?? '' },
    { key: 'spent', header: 'Total histórico', align: 'right', cell: (g) => <span className="font-medium text-ink tnum">{spentText(stats.get(g.id)!.spent)}</span>, sort: (g) => stats.get(g.id)!.spent.USD + stats.get(g.id)!.spent.ARS / 1e6 },
  ];

  const exportCSV = () => downloadCSV('huespedes.csv', ['Nombre', 'Email', 'Teléfono', 'País', 'Reservas', 'Última estadía', 'Total USD', 'Total ARS'], rows.map((g) => { const s = stats.get(g.id)!; return [guestName(g), g.email, g.phone, g.country, s.bookings, fmtDate(s.lastStay), s.spent.USD, s.spent.ARS]; }));

  return (
    <>
      <PageHeader title="Huéspedes" description={`${plural(rows.length, 'huésped', 'huéspedes')}${rows.length !== guests.length ? ` de ${guests.length}` : ''} · datos ficticios`} actions={<><Button icon={Download} onClick={exportCSV} disabled={rows.length === 0}>Exportar CSV</Button><Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Nuevo huésped</Button></>} />
      <Card padded={false}>
        <div className="grid gap-2 border-b border-line p-3 sm:grid-cols-[minmax(200px,1fr)_200px_220px] sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email o teléfono" aria-label="Buscar huéspedes" className="pl-9" />
          </div>
          <Select aria-label="País" value={country} onChange={(e) => setCountry(e.target.value)}><option value="all">Todos los países</option>{countries.map((c) => <option key={c}>{c}</option>)}</Select>
          <Select aria-label="Tipo" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="all">Todos</option><option value="upcoming">Con reservas próximas</option><option value="repeat">Recurrentes (2 o más)</option><option value="owes">Con saldo pendiente</option><option value="none">Sin reservas</option>
          </Select>
        </div>
        <DataTable rows={rows} columns={columns} rowKey={(g) => g.id} onRowClick={(g) => navigate(`/huespedes/${g.id}`)} initialSort={{ key: 'name', dir: 'asc' }}
          empty={<EmptyState icon={Users} title="Ningún huésped coincide" description="Probá con otra búsqueda o cambiá los filtros." action={<Button onClick={() => { setQ(''); setCountry('all'); setKind('all'); }}>Limpiar filtros</Button>} />} />
      </Card>
      {creating && <GuestModal guest={null} onClose={() => setCreating(false)} onSaved={(g) => navigate(`/huespedes/${g.id}`)} />}
    </>
  );
}
