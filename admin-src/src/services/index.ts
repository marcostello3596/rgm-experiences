import type { Dataset } from '@/types';
import type { Services } from './contracts';
import { mockServices } from './mock';

/**
 * ÚNICO PUNTO DE CAMBIO entre datos simulados y reales.
 * Cuando exista la integración (ver services/beds24/README.md), acá se devuelve esa implementación.
 */
export const services: Services = mockServices;

/** Lee todo el estado. Usa `snapshot` si el proveedor lo ofrece; si no, pide cada lista por separado. */
export async function fetchAll(s: Services = services): Promise<Dataset> {
  if (s.snapshot) return s.snapshot();
  const [properties, guests, reservations, payments, expenses, blocks, rates, seasons, tasks, conversations, templates, channels, sync, settings] = await Promise.all([
    s.properties.list(), s.guests.list(), s.reservations.list(), s.payments.list(), s.expenses.list(), s.availability.listBlocks(), s.pricing.listRates(),
    s.pricing.listSeasons(), s.tasks.list(), s.messaging.listConversations(), s.messaging.listTemplates(), s.channels.list(), s.channels.syncStatus(), s.settings.get(),
  ]);
  return { properties, guests, reservations, payments, expenses, blocks, rates, seasons, tasks, conversations, templates, channels, sync, settings };
}

export type { Services } from './contracts';
