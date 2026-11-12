import { BarChart3, Building2, CalendarRange, ClipboardList, LayoutDashboard, MessageSquare, Plug, Settings, SprayCan, Tags, Users, Wallet, type LucideIcon } from 'lucide-react';
import type { Section } from '@/auth/session';

export interface NavItem { section: Section; to: string; label: string; icon: LucideIcon; group: number }

export const NAV: NavItem[] = [
  { section: 'dashboard', to: '/', label: 'Dashboard', icon: LayoutDashboard, group: 0 },
  { section: 'calendario', to: '/calendario', label: 'Calendario', icon: CalendarRange, group: 0 },
  { section: 'reservas', to: '/reservas', label: 'Reservas', icon: ClipboardList, group: 0 },
  { section: 'departamentos', to: '/departamentos', label: 'Departamentos', icon: Building2, group: 1 },
  { section: 'huespedes', to: '/huespedes', label: 'Huéspedes', icon: Users, group: 1 },
  { section: 'tarifas', to: '/tarifas', label: 'Tarifas y disponibilidad', icon: Tags, group: 1 },
  { section: 'finanzas', to: '/finanzas', label: 'Finanzas', icon: Wallet, group: 2 },
  { section: 'tareas', to: '/tareas', label: 'Limpieza y tareas', icon: SprayCan, group: 2 },
  { section: 'mensajes', to: '/mensajes', label: 'Mensajes', icon: MessageSquare, group: 2 },
  { section: 'estadisticas', to: '/estadisticas', label: 'Estadísticas', icon: BarChart3, group: 2 },
  { section: 'canales', to: '/canales', label: 'Canales', icon: Plug, group: 3 },
  { section: 'configuracion', to: '/configuracion', label: 'Configuración', icon: Settings, group: 3 },
];

export const sectionFor = (pathname: string): NavItem => NAV.find((n) => n.to !== '/' && pathname.startsWith(n.to)) ?? NAV[0];
