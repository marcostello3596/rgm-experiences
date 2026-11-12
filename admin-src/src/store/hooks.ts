import { useMemo } from 'react';
import type { Currency, Guest, ID, Property } from '@/types';
import { useStore } from './useStore';
import { today } from '@/lib/dates';
import { viewFromSettings, type MoneyView } from '@/domain/money';
import type { MetricsSource } from '@/domain/metrics';

export const guestName = (g: Guest | undefined): string => (g ? `${g.firstName} ${g.lastName}`.trim() : 'Huésped eliminado');

/** Búsqueda rápida de departamentos y huéspedes por id. */
export function useLookup() {
  const properties = useStore((s) => s.properties);
  const guests = useStore((s) => s.guests);
  return useMemo(() => {
    const p = new Map<ID, Property>(properties.map((x) => [x.id, x]));
    const g = new Map<ID, Guest>(guests.map((x) => [x.id, x]));
    return {
      property: (id: ID | null | undefined) => (id ? p.get(id) : undefined),
      guest: (id: ID | null | undefined) => (id ? g.get(id) : undefined),
      propertyName: (id: ID | null | undefined) => (id ? p.get(id)?.internalName ?? 'Departamento eliminado' : 'General'),
      guestName: (id: ID | null | undefined) => guestName(id ? g.get(id) : undefined),
    };
  }, [properties, guests]);
}

export function useToday(): string {
  const tz = useStore((s) => s.settings.timezone);
  return today(tz);
}

export function useMoneyView(override?: Currency): MoneyView {
  const settings = useStore((s) => s.settings);
  return useMemo(() => viewFromSettings(settings, override), [settings, override]);
}

/** Datos que usan los indicadores. */
export function useMetricsSource(): MetricsSource {
  const reservations = useStore((s) => s.reservations);
  const payments = useStore((s) => s.payments);
  const properties = useStore((s) => s.properties);
  const blocks = useStore((s) => s.blocks);
  const expenses = useStore((s) => s.expenses);
  return useMemo(() => ({ reservations, payments, properties, blocks, expenses }), [reservations, payments, properties, blocks, expenses]);
}
