/**
 * Modelos del PMS.
 *
 * Criterios:
 * - Los `id` son identificadores internos estables (no cambian aunque se conecte Beds24).
 * - Los identificadores externos (Beds24, Airbnb, Booking.com) son siempre opcionales y viven en `external`.
 * - Las fechas de estadía son cadenas `YYYY-MM-DD` sin hora. `checkOut` y `end` son EXCLUSIVOS:
 *   la noche del día de salida no está ocupada.
 * - Cuando se conecte Beds24, será la fuente de verdad de reservas y disponibilidad.
 */

export type ID = string;
/** Fecha sin hora, `YYYY-MM-DD`. */
export type ISODate = string;
/** Fecha y hora ISO 8601. */
export type ISODateTime = string;

export type Currency = 'USD' | 'ARS';
export const CURRENCIES: Currency[] = ['USD', 'ARS'];

export type ChannelId = 'airbnb' | 'booking' | 'web' | 'manual';
export const CHANNEL_IDS: ChannelId[] = ['airbnb', 'booking', 'web', 'manual'];

/** Identificadores de sistemas externos. Ninguno es obligatorio en esta etapa. */
export interface ExternalIds {
  beds24PropertyId?: string;
  beds24RoomId?: string;
  beds24UnitId?: string;
  airbnbListingId?: string;
  bookingPropertyId?: string;
  bookingRoomId?: string;
  roomTypeId?: string;
  ratePlanId?: string;
  beds24BookingId?: string;
  channelReference?: string;
}

/** Unidad vendible dentro de una propiedad. Hoy cada departamento tiene una sola unidad. */
export interface Unit {
  id: ID;
  propertyId: ID;
  name: string;
  external: ExternalIds;
}

export interface Property {
  id: ID;
  internalName: string;
  publicName: string;
  description: string;
  address: string;
  city: string;
  capacity: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  photos: string[];
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  currency: Currency;
  basePrice: number;
  /** Precio de viernes y sábado. Si falta se usa el precio base. */
  weekendPrice?: number;
  cleaningFee: number;
  minStay: number;
  maxStay: number;
  /** Descuento en % para estadías de 7 noches o más. */
  weeklyDiscount: number;
  /** Descuento en % para estadías de 28 noches o más. */
  monthlyDiscount: number;
  active: boolean;
  units: Unit[];
  external: ExternalIds;
  /** true cuando el departamento es inventado para la demo. */
  demo?: boolean;
}

export interface Guest {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  document?: string;
  preferences: string[];
  notes: string;
  createdAt: ISODateTime;
  external?: ExternalIds;
}

export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
export const RESERVATION_STATUSES: ReservationStatus[] = ['confirmed', 'pending', 'completed', 'cancelled'];
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface PriceBreakdown {
  accommodation: number;
  cleaning: number;
  discount: number;
  taxes: number;
  /** Comisión del canal. En la demo es un valor ficticio. */
  channelFee: number;
}

export interface Note {
  id: ID;
  at: ISODateTime;
  author: string;
  text: string;
}

export interface HistoryEntry {
  id: ID;
  at: ISODateTime;
  action: string;
  detail?: string;
}

export interface Reservation {
  id: ID;
  code: string;
  propertyId: ID;
  unitId?: ID;
  guestId: ID;
  channel: ChannelId;
  checkIn: ISODate;
  /** Exclusivo: ese día puede entrar otra reserva. */
  checkOut: ISODate;
  adults: number;
  children: number;
  status: ReservationStatus;
  currency: Currency;
  breakdown: PriceBreakdown;
  observations: string;
  notes: Note[];
  history: HistoryEntry[];
  createdAt: ISODateTime;
  cancelledAt?: ISODateTime;
  external?: ExternalIds;
}

export type PaymentMethod = 'transfer' | 'cash' | 'card' | 'channel' | 'other';

export interface Payment {
  id: ID;
  reservationId: ID;
  date: ISODate;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  note: string;
}

export type ExpenseCategory = 'cleaning' | 'laundry' | 'maintenance' | 'utilities' | 'supplies' | 'other';
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['cleaning', 'laundry', 'maintenance', 'utilities', 'supplies', 'other'];

export interface Expense {
  id: ID;
  /** null = gasto general, no asignado a un departamento. */
  propertyId: ID | null;
  date: ISODate;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: Currency;
  paid: boolean;
}

export type BlockType = 'maintenance' | 'owner' | 'other';

export interface CalendarBlock {
  id: ID;
  propertyId: ID;
  start: ISODate;
  /** Exclusivo. */
  end: ISODate;
  type: BlockType;
  reason: string;
}

/** Excepción de tarifa para una fecha puntual. Lo que no esté definido se hereda de la propiedad. */
export interface Rate {
  propertyId: ID;
  date: ISODate;
  price?: number;
  minStay?: number;
}

export interface Season {
  id: ID;
  name: string;
  type: 'high' | 'low';
  start: ISODate;
  /** Exclusivo. */
  end: ISODate;
  /** Ajuste en % sobre el precio base (positivo o negativo). */
  adjustPct: number;
}

export type TaskType = 'cleaning' | 'maintenance';
export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: ID;
  propertyId: ID;
  type: TaskType;
  date: ISODate;
  assignee: string;
  status: TaskStatus;
  priority: TaskPriority;
  comments: string;
  /** Reserva cuyo check-out generó la limpieza. */
  reservationId?: ID;
}

export type ChannelStatus = 'pending_integration' | 'pending_config' | 'demo' | 'active' | 'connected' | 'error';

export interface Channel {
  id: ChannelId | 'beds24';
  name: string;
  description: string;
  status: ChannelStatus;
  /** Sólo existe cuando hay una conexión real. */
  lastSyncAt?: ISODateTime;
}

export interface SyncLogEntry {
  id: ID;
  at: ISODateTime;
  scope: 'reservations' | 'availability' | 'rates' | 'messages';
  result: 'ok' | 'error';
  detail: string;
}

export interface SyncStatus {
  channelId: Channel['id'];
  state: 'never' | 'idle' | 'syncing' | 'error';
  lastSyncAt?: ISODateTime;
  log: SyncLogEntry[];
  errors: SyncLogEntry[];
}

export interface Message {
  id: ID;
  at: ISODateTime;
  from: 'guest' | 'host';
  text: string;
  /** true = respuesta guardada sólo en este navegador; no se envió a ningún canal. */
  simulated?: boolean;
}

export interface Conversation {
  id: ID;
  guestId: ID;
  propertyId: ID;
  reservationId?: ID;
  channel: ChannelId;
  unread: boolean;
  messages: Message[];
}

export interface MessageTemplate {
  id: ID;
  name: string;
  text: string;
}

export type UserRole = 'admin' | 'operator' | 'cleaning';

export interface AdminUser {
  id: ID;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Settings {
  business: { name: string; legalName: string; email: string; phone: string; address: string; website: string };
  general: { language: 'es-AR'; dateFormat: 'dd/MM/yyyy'; weekStart: 'monday' | 'sunday'; defaultCalendarDays: 7 | 14 | 30 };
  currency: {
    /** Moneda en la que se muestran los indicadores. */
    reporting: Currency;
    /** Si es true, los importes en la otra moneda se convierten con `demoRate`. Si es false, se excluyen. */
    convert: boolean;
    /** Tipo de cambio FICTICIO: cuántos ARS equivalen a 1 USD. */
    demoRate: number;
  };
  timezone: string;
  notifications: { newReservation: boolean; cancellation: boolean; pendingPayment: boolean; checkInToday: boolean; cleaningPending: boolean; newMessage: boolean };
  policies: { depositPct: number; cancellationDays: number; checkInTime: string; checkOutTime: string; houseRules: string };
  /** Comisiones FICTICIAS por canal (en %), sólo para que la demo tenga números. */
  demoChannelFees: Record<ChannelId, number>;
  users: AdminUser[];
  staff: string[];
}

/** Estado completo de la demo (lo que se guarda en el navegador). */
export interface Dataset {
  properties: Property[];
  guests: Guest[];
  reservations: Reservation[];
  payments: Payment[];
  expenses: Expense[];
  blocks: CalendarBlock[];
  rates: Rate[];
  seasons: Season[];
  tasks: Task[];
  conversations: Conversation[];
  templates: MessageTemplate[];
  channels: Channel[];
  sync: SyncStatus[];
  settings: Settings;
}
