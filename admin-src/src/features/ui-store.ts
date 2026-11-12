import { create } from 'zustand';
import type { ID, ISODate } from '@/types';

/** Capas que se pueden abrir desde cualquier pantalla (formularios y panel lateral de reserva). */

export interface EntryDefaults { propertyId?: ID; checkIn?: ISODate; checkOut?: ISODate; guestId?: ID; kind?: 'reservation' | 'block' }

interface UIState {
  entry: { reservationId?: ID; blockId?: ID; defaults?: EntryDefaults } | null;
  drawerReservationId: ID | null;
  paymentReservationId: ID | null;
  newEntry: (defaults?: EntryDefaults) => void;
  editReservation: (id: ID) => void;
  editBlock: (id: ID) => void;
  closeEntry: () => void;
  openDrawer: (id: ID) => void;
  closeDrawer: () => void;
  openPayment: (id: ID) => void;
  closePayment: () => void;
}

export const useUI = create<UIState>((set) => ({
  entry: null,
  drawerReservationId: null,
  paymentReservationId: null,
  newEntry: (defaults) => set({ entry: { defaults } }),
  editReservation: (reservationId) => set({ entry: { reservationId } }),
  editBlock: (blockId) => set({ entry: { blockId } }),
  closeEntry: () => set({ entry: null }),
  openDrawer: (drawerReservationId) => set({ drawerReservationId }),
  closeDrawer: () => set({ drawerReservationId: null }),
  openPayment: (paymentReservationId) => set({ paymentReservationId }),
  closePayment: () => set({ paymentReservationId: null }),
}));
