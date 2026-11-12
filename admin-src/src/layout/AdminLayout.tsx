import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { canAccess } from '@/auth/session';
import { Button, EmptyState, PageSkeleton } from '@/ui/primitives';
import { ConfirmHost, ToastHost } from '@/ui/overlays';
import { Sidebar } from './Sidebar';
import { MobilePropertyFilter, Topbar } from './Topbar';
import { sectionFor } from './nav';

const COLLAPSE_KEY = 'rgm-pms-sidebar';

export function AdminLayout() {
  const { ready, loadError, load, session } = useStore();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => { document.title = `${sectionFor(pathname).label} · RGM PMS`; }, [pathname]);

  const toggle = () => setCollapsed((c) => { try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* preferencia opcional */ } return !c; });
  const allowed = !session || canAccess(session.role, sectionFor(pathname).section);

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <div className="hidden lg:block"><Sidebar collapsed={collapsed} onToggle={toggle} /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-pop"><Sidebar collapsed={false} mobile onNavigate={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main id="contenido" className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6">
            <MobilePropertyFilter />
            {loadError ? (
              <EmptyState icon={AlertTriangle} title="No se pudieron cargar los datos" description={loadError} action={<Button variant="primary" onClick={() => void load()}>Reintentar</Button>} />
            ) : !ready ? (
              <PageSkeleton />
            ) : !allowed ? (
              <EmptyState icon={AlertTriangle} title="Tu rol no tiene acceso a esta sección" />
            ) : (
              <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
            )}
          </div>
        </main>
      </div>
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}
