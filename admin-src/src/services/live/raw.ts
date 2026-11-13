/**
 * Formas de los datos de Beds24 API V2 que usa el panel (sólo los campos necesarios).
 * Tomadas de la especificación oficial (https://beds24.com/api/v2/apiV2.yaml) y verificadas contra la cuenta.
 * Fechas: `arrival` es el día de entrada y `departure` el de salida (exclusivo). En el calendario, `from` y `to` son inclusivos.
 */

export interface B24Room {
  id: number;
  propertyId?: number;
  name: string;
  qty?: number;
  maxPeople?: number;
  maxAdult?: number | null;
  maxChildren?: number | null;
  minStay?: number;
  maxStay?: number;
  cleaningFee?: number;
  units?: { id: number; name?: string }[];
}

export interface B24Property {
  id: number;
  name: string;
  propertyType?: string;
  currency?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  checkInStart?: string;
  checkOutEnd?: string;
  roomTypes?: B24Room[];
}

export type B24Status = 'confirmed' | 'request' | 'new' | 'cancelled' | 'black' | 'inquiry';

export interface B24InvoiceItem {
  id: number;
  type: 'charge' | 'payment';
  description?: string;
  qty?: number;
  amount?: number;
  lineTotal?: number;
  createTime?: string;
}

export interface B24InfoItem { id: number; code?: string; text?: string; createTime?: string }

export interface B24Booking {
  id: number;
  propertyId: number;
  roomId: number;
  status: B24Status;
  arrival: string;
  departure: string;
  numAdult?: number;
  numChild?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  country?: string;
  country2?: string | null;
  comments?: string;
  notes?: string;
  custom10?: string;
  price?: number;
  commission?: number;
  channel?: string;
  apiReference?: string;
  referer?: string;
  bookingTime?: string;
  modifiedTime?: string;
  cancelTime?: string | null;
  invoiceItems?: B24InvoiceItem[];
  infoItems?: B24InfoItem[];
}

export interface B24CalendarRange {
  from: string;
  to: string;
  numAvail?: number;
  minStay?: number;
  maxStay?: number;
  override?: 'none' | 'blackout' | 'exception' | 'noCheckIn' | 'noCheckOut' | 'noCheckInOrCheckOut';
  price1?: number | null;
}

export interface B24RoomCalendar { roomId: number; propertyId: number; name?: string; calendar: B24CalendarRange[] }

export interface B24Message {
  id: number;
  bookingId: number;
  read?: boolean;
  message?: string;
  source: 'host' | 'guest' | 'internalNote' | 'system';
  time?: string;
  propertyId?: number;
  roomId?: number;
}
