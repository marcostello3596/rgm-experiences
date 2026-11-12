import type { Dataset, ISODate, Task } from '@/types';
import { isActive } from '@/domain/reservations';

export const cleaningTaskId = (reservationId: string): string => `tsk_clean_${reservationId}`;

/**
 * Mantiene una tarea de limpieza por cada check-out de una reserva activa.
 * - Reserva nueva o con fechas cambiadas → crea o reprograma la limpieza (si todavía no se terminó).
 * - Reserva cancelada o borrada → quita la limpieza si seguía pendiente.
 * `seeding` marca como terminadas las limpiezas de check-outs ya pasados al generar la demo.
 */
export function syncCleaningTasks(ds: Dataset, today: ISODate, seeding = false): void {
  const staff = ds.settings.staff.filter((s) => s.toLowerCase().includes('limpieza'));
  const byId = new Map(ds.tasks.map((t) => [t.id, t]));
  const wanted = new Set<string>();

  ds.reservations.forEach((r, i) => {
    if (!isActive(r)) return;
    const id = cleaningTaskId(r.id);
    wanted.add(id);
    const existing = byId.get(id);
    if (existing) {
      if (existing.status !== 'done') { existing.date = r.checkOut; existing.propertyId = r.propertyId; }
      return;
    }
    const task: Task = {
      id,
      propertyId: r.propertyId,
      type: 'cleaning',
      date: r.checkOut,
      assignee: staff.length ? staff[i % staff.length] : '',
      status: seeding && r.checkOut < today ? 'done' : seeding && r.checkOut === today && i % 2 === 0 ? 'in_progress' : 'pending',
      priority: 'normal',
      comments: '',
      reservationId: r.id,
    };
    ds.tasks.push(task);
  });

  ds.tasks = ds.tasks.filter((t) => !(t.type === 'cleaning' && t.reservationId && !wanted.has(t.id) && t.status !== 'done'));

  // Prioridad alta cuando el mismo día entra otro huésped al departamento
  for (const t of ds.tasks) {
    if (t.type !== 'cleaning' || t.status === 'done' || !t.reservationId) continue;
    const sameDayArrival = ds.reservations.some((r) => isActive(r) && r.propertyId === t.propertyId && r.checkIn === t.date);
    if (sameDayArrival) t.priority = 'high';
    else if (t.priority === 'high') t.priority = 'normal';
  }
}
