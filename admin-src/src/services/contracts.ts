import type {
  CalendarBlock, ChannelId, Channel, Conversation, Dataset, Expense, Guest, ID, ISODate, Message, MessageTemplate, Note, Payment, Property,
  Rate, Reservation, Season, Settings, SyncStatus, Task,
} from '@/types';

/**
 * CONTRATOS DE SERVICIOS
 *
 * Las pantallas nunca leen ni escriben datos directamente: pasan por estos proveedores.
 * Hoy la implementación es `services/mock` (datos ficticios guardados en el navegador).
 * Para conectar Beds24 se escribe otra implementación de estas mismas interfaces (que llame a un backend propio,
 * nunca a Beds24 desde el navegador) y se cambia en `services/index.ts`. Los componentes no se tocan.
 *
 * Todos los métodos son asíncronos a propósito, aunque la demo responda al instante.
 * Los errores de validación se lanzan como `DomainError` con un mensaje listo para mostrar.
 */

export type NewReservation = Omit<Reservation, 'id' | 'code' | 'notes' | 'history' | 'createdAt' | 'cancelledAt'> & { createdAt?: string };
export type ReservationPatch = Partial<Omit<Reservation, 'id' | 'code' | 'notes' | 'history' | 'createdAt'>>;

export interface ReservationProvider {
  list(): Promise<Reservation[]>;
  create(input: NewReservation): Promise<Reservation>;
  update(id: ID, patch: ReservationPatch): Promise<Reservation>;
  cancel(id: ID): Promise<Reservation>;
  /** Borra definitivamente. Sólo tiene sentido con reservas de prueba. */
  remove(id: ID): Promise<void>;
  addNote(id: ID, text: string, author: string): Promise<Note>;
  removeNote(id: ID, noteId: ID): Promise<void>;
}

export interface PaymentProvider {
  list(): Promise<Payment[]>;
  create(input: Omit<Payment, 'id'>): Promise<Payment>;
  remove(id: ID): Promise<void>;
}

export interface PropertyProvider {
  list(): Promise<Property[]>;
  create(input: Omit<Property, 'id' | 'units'>): Promise<Property>;
  update(id: ID, patch: Partial<Omit<Property, 'id'>>): Promise<Property>;
}

export interface AvailabilityProvider {
  listBlocks(): Promise<CalendarBlock[]>;
  createBlock(input: Omit<CalendarBlock, 'id'>): Promise<CalendarBlock>;
  updateBlock(id: ID, patch: Partial<Omit<CalendarBlock, 'id'>>): Promise<CalendarBlock>;
  removeBlock(id: ID): Promise<void>;
}

export interface RateChange {
  propertyIds: ID[];
  start: ISODate;
  /** Exclusivo. */
  end: ISODate;
  /** undefined = no tocar · null = quitar la excepción y volver al precio heredado. */
  price?: number | null;
  minStay?: number | null;
  /** Aplicar sólo a estas noches de la semana (0 = domingo … 6 = sábado). Vacío = todas. */
  weekdays?: number[];
}

export interface PricingProvider {
  listRates(): Promise<Rate[]>;
  /** Edición en lote. Con Beds24 este método enviará precios y estadías mínimas al inventario central. */
  applyRates(change: RateChange): Promise<void>;
  listSeasons(): Promise<Season[]>;
  saveSeason(season: Omit<Season, 'id'> & { id?: ID }): Promise<Season>;
  removeSeason(id: ID): Promise<void>;
}

export interface GuestProvider {
  list(): Promise<Guest[]>;
  create(input: Omit<Guest, 'id' | 'createdAt'>): Promise<Guest>;
  update(id: ID, patch: Partial<Omit<Guest, 'id'>>): Promise<Guest>;
}

export interface MessagingProvider {
  listConversations(): Promise<Conversation[]>;
  listTemplates(): Promise<MessageTemplate[]>;
  /** En la demo sólo guarda el texto localmente; no envía nada a ningún canal. */
  send(conversationId: ID, text: string): Promise<Message>;
  markRead(conversationId: ID, read: boolean): Promise<void>;
  saveTemplate(template: Omit<MessageTemplate, 'id'> & { id?: ID }): Promise<MessageTemplate>;
  removeTemplate(id: ID): Promise<void>;
}

export interface ExpenseProvider {
  list(): Promise<Expense[]>;
  save(expense: Omit<Expense, 'id'> & { id?: ID }): Promise<Expense>;
  remove(id: ID): Promise<void>;
}

export interface TaskProvider {
  list(): Promise<Task[]>;
  save(task: Omit<Task, 'id'> & { id?: ID }): Promise<Task>;
  remove(id: ID): Promise<void>;
}

export interface ChannelProvider {
  list(): Promise<Channel[]>;
  syncStatus(): Promise<SyncStatus[]>;
}

export interface SettingsProvider {
  get(): Promise<Settings>;
  update(patch: Partial<Settings>): Promise<Settings>;
}

/** Qué permite la fuente de datos. La interfaz se adapta a esto en lugar de preguntar por el modo. */
export interface ServicePolicy {
  /** Reservas de estos canales se modifican en el canal (Airbnb, Booking.com), no en el panel. */
  lockedChannels: ChannelId[];
  /** Canales que se pueden elegir al cargar una reserva a mano. */
  creatableChannels: ChannelId[];
  /** true: un mensaje escrito en el panel le llega de verdad al huésped. */
  messagesAreReal: boolean;
  /** false: los precios por fecha se cargan directamente (no hay temporadas ni precio de fin de semana automáticos). */
  seasonalPricing: boolean;
  /** Campos de la ficha del departamento que se guardan sólo en este navegador. */
  localPropertyFields: (keyof Property)[];
  /** Módulos cuyos datos se guardan sólo en este navegador (texto para avisar en pantalla). */
  localModules: string[];
  /** Nombre de la fuente de datos para mostrar ("Beds24", "Demostración"). */
  sourceName: string;
}

export interface Services {
  /** 'demo' mientras los datos sean ficticios. La interfaz muestra el cartel de demostración según este valor. */
  mode: 'demo' | 'live';
  policy: ServicePolicy;
  /** Vuelve a leer todo desde la fuente (por ejemplo, para traer reservas nuevas de los canales). */
  refresh?: () => Promise<void>;
  /** Borra datos guardados temporalmente (al cerrar sesión). */
  clearCache?: () => void;
  reservations: ReservationProvider;
  payments: PaymentProvider;
  properties: PropertyProvider;
  availability: AvailabilityProvider;
  pricing: PricingProvider;
  guests: GuestProvider;
  messaging: MessagingProvider;
  expenses: ExpenseProvider;
  tasks: TaskProvider;
  channels: ChannelProvider;
  settings: SettingsProvider;
  /** Sólo demo: vuelve a generar los datos ficticios. */
  resetDemo?: () => Promise<void>;
  /** Sólo demo: lectura completa de una vez (evita 12 pedidos al cargar). */
  snapshot?: () => Promise<Dataset>;
}
