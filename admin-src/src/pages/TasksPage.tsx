import { useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, CalendarDays, Check, CheckCircle2, MessageSquareText, Pencil, Play, Plus, RotateCcw, SprayCan, Trash2, User, Wrench } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus, TaskType } from '@/types';
import { useStore } from '@/store/useStore';
import { useLookup, useToday } from '@/store/hooks';
import { services } from '@/services';
import { addDays, fmtShort, weekdayShort } from '@/lib/dates';
import { plural } from '@/lib/format';
import { TASK_PRIORITY, TASK_STATUS, TASK_TYPE } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { Badge, Button, Card, Field, IconButton, Input, Notice, PageHeader, Segmented, Select, Textarea } from '@/ui/primitives';
import { confirm, Modal } from '@/ui/overlays';

type Scope = 'today' | 'week' | 'all';

export default function TasksPage() {
  const { tasks, propertyFilter, settings, run } = useStore();
  const look = useLookup();
  const today = useToday();
  const [scope, setScope] = useState<Scope>('week');
  const [assignee, setAssignee] = useState('all');
  const [editing, setEditing] = useState<Task | 'new' | null>(null);

  const visible = useMemo(() => tasks.filter((t) => {
    if (propertyFilter !== 'all' && t.propertyId !== propertyFilter) return false;
    if (assignee !== 'all' && (assignee === 'none' ? t.assignee !== '' : t.assignee !== assignee)) return false;
    if (t.status === 'done') return t.date >= addDays(today, -7) && t.date <= addDays(today, scope === 'all' ? 3650 : 7);
    if (scope === 'today') return t.date <= today;
    if (scope === 'week') return t.date <= addDays(today, 7);
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date)), [tasks, propertyFilter, assignee, scope, today]);

  const setStatus = (t: Task, status: TaskStatus) => run(() => services.tasks.save({ ...t, status }), { success: status === 'done' ? `${TASK_TYPE[t.type]} de ${look.propertyName(t.propertyId)} completada.` : undefined });
  const remove = async (t: Task) => {
    if (await confirm({ title: 'Eliminar tarea', message: t.reservationId ? 'Es la limpieza de un check-out: en lugar de borrarse queda marcada como terminada.' : 'La tarea se borra definitivamente.', confirmLabel: 'Eliminar' })) await run(() => services.tasks.remove(t.id), { success: 'Tarea eliminada.' });
  };

  const columns: { id: string; title: string; icon: typeof SprayCan; tone: string; items: Task[]; empty: string }[] = [
    { id: 'c-pending', title: 'Limpiezas pendientes', icon: SprayCan, tone: 'text-warn', items: visible.filter((t) => t.type === 'cleaning' && t.status === 'pending'), empty: 'No hay limpiezas pendientes.' },
    { id: 'c-progress', title: 'Limpiezas en proceso', icon: Play, tone: 'text-info', items: visible.filter((t) => t.type === 'cleaning' && t.status === 'in_progress'), empty: 'Ninguna limpieza en curso.' },
    { id: 'c-done', title: 'Limpiezas terminadas', icon: CheckCircle2, tone: 'text-ok', items: visible.filter((t) => t.type === 'cleaning' && t.status === 'done').reverse(), empty: 'Todavía no se terminó ninguna.' },
    { id: 'm-pending', title: 'Mantenimiento pendiente', icon: Wrench, tone: 'text-accent', items: visible.filter((t) => t.type === 'maintenance' && t.status !== 'done'), empty: 'Sin mantenimiento pendiente.' },
  ];
  const doneMaintenance = visible.filter((t) => t.type === 'maintenance' && t.status === 'done');
  const overdue = visible.filter((t) => t.status !== 'done' && t.date < today).length;

  const card = (t: Task) => {
    const late = t.status !== 'done' && t.date < today;
    return (
      <li key={t.id} className={cn('rounded-xl border bg-surface p-3 shadow-card', late ? 'border-bad/30' : 'border-line')}>
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-ink">{look.propertyName(t.propertyId)}</p>
          <div className="-mt-1 -mr-1 flex shrink-0"><IconButton icon={Pencil} label="Editar" tipPos="top" onClick={() => setEditing(t)} className="size-7" /><IconButton icon={Trash2} label="Eliminar" tipPos="left" onClick={() => void remove(t)} className="size-7" /></div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone={late ? 'red' : t.date === today ? 'wine' : 'gray'}><CalendarDays className="size-3" />{late ? `Atrasada · ${fmtShort(t.date)}` : t.date === today ? 'Hoy' : <span className="capitalize">{weekdayShort(t.date)} {fmtShort(t.date)}</span>}</Badge>
          {t.priority !== 'normal' && <Badge tone={TASK_PRIORITY[t.priority].tone}>Prioridad {TASK_PRIORITY[t.priority].label.toLowerCase()}</Badge>}
          {t.type === 'maintenance' && t.status === 'in_progress' && <Badge tone="blue">En proceso</Badge>}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><User className="size-3" />{t.assignee || 'Sin responsable'}</p>
        {t.comments && <p className="mt-1.5 flex items-start gap-1.5 text-xs text-body"><MessageSquareText className="mt-0.5 size-3 shrink-0 text-muted" />{t.comments}</p>}
        <div className="mt-3 flex gap-2">
          {t.status === 'pending' && <Button size="sm" icon={Play} className="flex-1" onClick={() => void setStatus(t, 'in_progress')}>Empezar</Button>}
          {t.status !== 'done' && <Button size="sm" variant="primary" icon={Check} className="flex-1" onClick={() => void setStatus(t, 'done')}>Completar</Button>}
          {t.status === 'done' && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => void setStatus(t, 'pending')}>Reabrir</Button>}
        </div>
      </li>
    );
  };

  return (
    <>
      <PageHeader
        title="Limpieza y tareas"
        description={overdue > 0 ? <span className="text-bad">{plural(overdue, 'tarea atrasada', 'tareas atrasadas')}</span> : 'Las limpiezas se crean solas con cada check-out.'}
        actions={<>
          <Select aria-label="Responsable" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-52"><option value="all">Todos los responsables</option>{settings.staff.map((s) => <option key={s}>{s}</option>)}<option value="none">Sin responsable</option></Select>
          <Segmented value={scope} onChange={setScope} options={[{ value: 'today', label: 'Hoy' }, { value: 'week', label: '7 días' }, { value: 'all', label: 'Todas' }]} />
          <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>Nueva tarea</Button>
        </>}
      />
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {columns.map((c) => (
          <section key={c.id} className="flex min-h-40 flex-col rounded-xl border border-line bg-black/[0.02]">
            <header className="flex items-center gap-2 px-3.5 py-3">
              <c.icon className={cn('size-4', c.tone)} />
              <h3 className="text-[13px] font-semibold text-ink">{c.title}</h3>
              <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted shadow-card tnum">{c.items.length}</span>
            </header>
            {c.items.length === 0 ? <p className="px-3.5 pb-4 text-[13px] text-muted">{c.empty}</p> : <ul className="scroll-thin max-h-[calc(100dvh-250px)] space-y-2.5 overflow-y-auto px-2.5 pb-3">{c.items.map(card)}</ul>}
          </section>
        ))}
      </div>
      {doneMaintenance.length > 0 && (
        <Card className="mt-4">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-ink">Mantenimiento terminado ({doneMaintenance.length})</summary>
            <ul className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">{doneMaintenance.map(card)}</ul>
          </details>
        </Card>
      )}
      {editing && <TaskModal task={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function TaskModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { properties, propertyFilter, settings, run } = useStore();
  const today = useToday();
  const [f, setF] = useState<Omit<Task, 'id'>>(task ?? { propertyId: propertyFilter !== 'all' ? propertyFilter : properties[0]?.id ?? '', type: 'maintenance', date: today, assignee: '', status: 'pending', priority: 'normal', comments: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const staff = f.assignee && !settings.staff.includes(f.assignee) ? [f.assignee, ...settings.staff] : settings.staff;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await run(() => services.tasks.save({ ...f, id: task?.id, comments: f.comments.trim() }), { rethrow: true, success: task ? 'Tarea actualizada.' : 'Tarea creada.' });
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar.'); } finally { setSaving(false); }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={task ? 'Editar tarea' : 'Nueva tarea'} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" type="submit" form="task-form" loading={saving}>Guardar</Button></>}>
      <form id="task-form" onSubmit={submit} className="space-y-4">
        {task?.reservationId && <Notice tone="blue">Limpieza generada por un check-out. Si cambian las fechas de la reserva, se reprograma sola.</Notice>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo"><Select value={f.type} disabled={Boolean(task?.reservationId)} onChange={(e) => setF({ ...f, type: e.target.value as TaskType })}>{(Object.keys(TASK_TYPE) as TaskType[]).map((t) => <option key={t} value={t}>{TASK_TYPE[t]}</option>)}</Select></Field>
          <Field label="Departamento"><Select value={f.propertyId} disabled={Boolean(task?.reservationId)} onChange={(e) => setF({ ...f, propertyId: e.target.value })} required>{properties.map((p) => <option key={p.id} value={p.id}>{p.internalName}</option>)}</Select></Field>
          <Field label="Fecha programada"><Input type="date" value={f.date} disabled={Boolean(task?.reservationId)} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
          <Field label="Prioridad"><Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as TaskPriority })}>{(Object.keys(TASK_PRIORITY) as TaskPriority[]).map((p) => <option key={p} value={p}>{TASK_PRIORITY[p].label}</option>)}</Select></Field>
          <Field label="Responsable"><Select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })}><option value="">Sin responsable</option>{staff.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Estado"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as TaskStatus })}>{(Object.keys(TASK_STATUS) as TaskStatus[]).map((s) => <option key={s} value={s}>{TASK_STATUS[s].label}</option>)}</Select></Field>
        </div>
        <Field label="Comentarios" optional><Textarea value={f.comments} onChange={(e) => setF({ ...f, comments: e.target.value })} rows={3} placeholder="Qué hay que hacer, dónde están las llaves…" /></Field>
        {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
      </form>
    </Modal>
  );
}
