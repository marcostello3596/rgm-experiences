import type { Dataset } from '@/types';
import { today } from '@/lib/dates';
import { buildDataset } from './seed';

/** "Base de datos" de la demo: un objeto en memoria que se guarda en localStorage. */

const KEY = 'rgm-pms-demo-v1';
let cache: Dataset | null = null;

export function loadDb(): Dataset {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as Dataset;
      return cache;
    }
  } catch {
    // almacenamiento no disponible o dañado: se regenera
  }
  cache = buildDataset(today());
  saveDb();
  return cache;
}

export function saveDb(): void {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // sin almacenamiento (modo privado, cuota llena): la demo sigue funcionando en memoria
  }
}

export function resetDb(): Dataset {
  cache = buildDataset(today());
  saveDb();
  return cache;
}

/** Simula la demora de una llamada de red. */
export const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
