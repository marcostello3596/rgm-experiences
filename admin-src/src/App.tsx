import { lazy } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { AdminLayout } from '@/layout/AdminLayout';
import { EmptyState } from '@/ui/primitives';
import { EntryModal } from '@/features/EntryModal';
import { PaymentModal } from '@/features/reservation-parts';
import { ReservationDrawer } from '@/features/ReservationDrawer';

const Dashboard = lazy(() => import('@/pages/DashboardPage'));
const Calendar = lazy(() => import('@/pages/CalendarPage'));
const Reservations = lazy(() => import('@/pages/ReservationsPage'));
const ReservationDetail = lazy(() => import('@/pages/ReservationDetailPage'));
const Properties = lazy(() => import('@/pages/PropertiesPage'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetailPage'));
const Rates = lazy(() => import('@/pages/RatesPage'));
const Guests = lazy(() => import('@/pages/GuestsPage'));
const GuestDetail = lazy(() => import('@/pages/GuestDetailPage'));
const Finance = lazy(() => import('@/pages/FinancePage'));
const Tasks = lazy(() => import('@/pages/TasksPage'));
const Messages = lazy(() => import('@/pages/MessagesPage'));
const Stats = lazy(() => import('@/pages/StatsPage'));
const Channels = lazy(() => import('@/pages/ChannelsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function NotFound() {
  return <EmptyState icon={Compass} title="Esta página no existe" description="Puede que el enlace esté mal escrito o que el elemento se haya eliminado." action={<Link to="/" className="text-sm font-medium text-accent hover:underline">Volver al dashboard</Link>} />;
}

export function App() {
  return (
    <>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendario" element={<Calendar />} />
          <Route path="reservas" element={<Reservations />} />
          <Route path="reservas/:id" element={<ReservationDetail />} />
          <Route path="departamentos" element={<Properties />} />
          <Route path="departamentos/:id" element={<PropertyDetail />} />
          <Route path="tarifas" element={<Rates />} />
          <Route path="huespedes" element={<Guests />} />
          <Route path="huespedes/:id" element={<GuestDetail />} />
          <Route path="finanzas" element={<Finance />} />
          <Route path="tareas" element={<Tasks />} />
          <Route path="mensajes" element={<Messages />} />
          <Route path="estadisticas" element={<Stats />} />
          <Route path="canales" element={<Channels />} />
          <Route path="configuracion" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <ReservationDrawer />
      <EntryModal />
      <PaymentModal />
    </>
  );
}
