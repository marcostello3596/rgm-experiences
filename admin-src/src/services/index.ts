import type { Dataset } from '@/types';
import type { Services } from './contracts';
import { mockServices } from './mock';
import { liveServices } from './live';

/**
 * ÚNICO PUNTO DE CAMBIO entre datos simulados y reales.
 * - `VITE_DATA_SOURCE=beds24` (producción y `npm run dev:live`): Beds24 a través de las funciones de /api.
 * - Sin esa variable (`npm run dev`): demostración con datos ficticios en el navegador.
 */
export const DATA_SOURCE: 'beds24' | 'demo' = import.meta.env.VITE_DATA_SOURCE === 'beds24' ? 'beds24' : 'demo';
export const services: Services = DATA_SOURCE === 'beds24' ? liveServices : mockServices;

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
