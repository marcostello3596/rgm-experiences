import type { BlockType, ChannelId, ChannelStatus, ExpenseCategory, PaymentMethod, PaymentStatus, ReservationStatus, TaskPriority, TaskStatus, TaskType, UserRole } from '@/types';

/** Textos y colores compartidos por todas las pantallas. */

export const CHANNEL: Record<ChannelId, { label: string; color: string; soft: string; text: string }> = {
  airbnb: { label: 'Airbnb', color: '#e8526a', soft: '#fde8ec', text: '#a8233b' },
  booking: { label: 'Booking.com', color: '#2f6fd6', soft: '#e4eefc', text: '#1c4a99' },
  web: { label: 'Página web', color: '#2e9e6b', soft: '#e0f4ea', text: '#1b6b47' },
  manual: { label: 'Manual', color: '#7c5cd6', soft: '#ece7fb', text: '#5236a8' },
};
export const BLOCK_COLOR = { color: '#8a8f98', soft: '#eceef1', text: '#4b5058' };

export const RES_STATUS: Record<ReservationStatus, { label: string; tone: Tone }> = {
  confirmed: { label: 'Confirmada', tone: 'green' },
  pending: { label: 'Pendiente', tone: 'amber' },
  cancelled: { label: 'Cancelada', tone: 'red' },
  completed: { label: 'Finalizada', tone: 'gray' },
};
export const PAY_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  paid: { label: 'Pagada', tone: 'green' },
  partial: { label: 'Pago parcial', tone: 'amber' },
  unpaid: { label: 'Sin pagar', tone: 'red' },
};
export const PAY_METHOD: Record<PaymentMethod, string> = { transfer: 'Transferencia', cash: 'Efectivo', card: 'Tarjeta', channel: 'Cobrado por el canal', other: 'Otro' };
export const EXPENSE_CAT: Record<ExpenseCategory, { label: string; color: string }> = {
  cleaning: { label: 'Limpieza', color: '#3d1a22' },
  laundry: { label: 'Lavandería', color: '#8d6b41' },
  maintenance: { label: 'Mantenimiento', color: '#2f6fd6' },
  utilities: { label: 'Servicios', color: '#2e9e6b' },
  supplies: { label: 'Insumos', color: '#7c5cd6' },
  other: { label: 'Otros gastos', color: '#8a8f98' },
};
export const BLOCK_TYPE: Record<BlockType, string> = { maintenance: 'Mantenimiento', owner: 'Uso propio', other: 'Otro motivo' };
export const TASK_TYPE: Record<TaskType, string> = { cleaning: 'Limpieza', maintenance: 'Mantenimiento' };
export const TASK_STATUS: Record<TaskStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pendiente', tone: 'amber' },
  in_progress: { label: 'En proceso', tone: 'blue' },
  done: { label: 'Terminada', tone: 'green' },
};
export const TASK_PRIORITY: Record<TaskPriority, { label: string; tone: Tone }> = {
  low: { label: 'Baja', tone: 'gray' },
  normal: { label: 'Normal', tone: 'blue' },
  high: { label: 'Alta', tone: 'red' },
};
export const CHANNEL_STATUS: Record<ChannelStatus, { label: string; tone: Tone }> = {
  pending_integration: { label: 'Pendiente de integración', tone: 'amber' },
  pending_config: { label: 'Pendiente de configuración', tone: 'amber' },
  demo: { label: 'Modo demo', tone: 'violet' },
  active: { label: 'Activo', tone: 'green' },
  connected: { label: 'Conectado', tone: 'green' },
  error: { label: 'Con errores', tone: 'red' },
};
export const ROLE: Record<UserRole, { label: string; description: string }> = {
  admin: { label: 'Administrador', description: 'Acceso completo: reservas, tarifas, finanzas y configuración.' },
  operator: { label: 'Operador', description: 'Reservas, calendario, huéspedes, mensajes y tareas. Sin finanzas ni configuración.' },
  cleaning: { label: 'Personal de limpieza', description: 'Sólo sus tareas de limpieza y mantenimiento.' },
};

export type Tone = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'violet' | 'wine';

export const COUNTRIES = ['Argentina', 'Brasil', 'Chile', 'Uruguay', 'Paraguay', 'Perú', 'Colombia', 'México', 'Estados Unidos', 'España', 'Francia', 'Alemania', 'Reino Unido', 'Italia', 'Otro'];
export const AMENITIES = ['Wi-Fi', 'Aire acondicionado', 'Calefacción', 'Cocina equipada', 'Smart TV', 'Lavarropas', 'Cochera', 'Pileta', 'Balcón', 'Ascensor', 'Parrilla', 'Ropa blanca', 'Secador de pelo', 'Cafetera', 'Escritorio', 'Apto mascotas'];
