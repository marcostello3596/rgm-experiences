import { useState, type FormEvent } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Field, Input, Notice } from '@/ui/primitives';
import { Logo } from './Sidebar';

/** Ingreso con la contraseña del panel (se verifica en el servidor). */
export function LoginPage() {
  const signIn = useStore((s) => s.signIn);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ingresar.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm animate-up">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h1 className="text-lg font-semibold text-ink">Ingresar al panel</h1>
          <p className="mt-1 mb-5 text-[13px] text-muted">Administración de RGM Experiences.</p>
          <Field label="Contraseña">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus required invalid={Boolean(error)} />
          </Field>
          {error && <Notice tone="red" icon={AlertCircle} className="mt-3">{error}</Notice>}
          <Button variant="primary" type="submit" icon={Lock} loading={busy} disabled={!password} className="mt-5 w-full">Ingresar</Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted"><a href="/" className="hover:text-ink hover:underline">Volver al sitio</a></p>
      </div>
    </div>
  );
}
