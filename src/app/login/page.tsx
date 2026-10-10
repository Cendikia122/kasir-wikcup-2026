'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { runSeeder } from '@/lib/seeder';
import { login, setSession } from '@/lib/auth';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runSeeder();
  }, []);

  const handleLoginWithPassword = async (pwdToUse: string) => {
    setLoading(true);
    setError('');

    try {
      // 1. Try server API login first (sets HTTP cookie reliably across network devices)
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdToUse }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSession(data.session);

        const redirect = params.get('redirect');
        const targetUrl =
          data.session.role === 'admin' || redirect === 'admin'
            ? '/admin'
            : '/';

        // Use window.location to ensure HTTP cookie is attached on navigation
        window.location.href = targetUrl;
        return;
      } else {
        // Fallback to client login
        const clientSession = login(pwdToUse);
        if (clientSession) {
          const redirect = params.get('redirect');
          const targetUrl =
            clientSession.role === 'admin' || redirect === 'admin'
              ? '/admin'
              : '/';
          window.location.href = targetUrl;
          return;
        }

        setError(data.error || 'Password salah. Coba lagi.');
        setLoading(false);
      }
    } catch {
      // Offline fallback
      const clientSession = login(pwdToUse);
      if (clientSession) {
        const redirect = params.get('redirect');
        const targetUrl =
          clientSession.role === 'admin' || redirect === 'admin'
            ? '/admin'
            : '/';
        window.location.href = targetUrl;
        return;
      }
      setError('Password salah atau koneksi terputus.');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    handleLoginWithPassword(password.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-900 rounded-2xl mb-4 shadow-sm">
            <span className="text-white text-2xl">🛍️</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">Bazar Wikcup 2026</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Masuk ke sistem kasir & pembelian
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white shadow-2xs"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs active:scale-98"
          >
            {loading ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>

        {/* Quick Click Hint / Auto-Fill */}
        <div className="mt-6 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Pilih Akses Cepat:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleLoginWithPassword('admin123')}
              className="p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 text-left transition-all cursor-pointer group"
            >
              <p className="text-xs font-bold text-zinc-800 group-hover:text-zinc-900">
                Akses Admin
              </p>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                admin123
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleLoginWithPassword('user123')}
              className="p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 text-left transition-all cursor-pointer group"
            >
              <p className="text-xs font-bold text-zinc-800 group-hover:text-zinc-900">
                Akses Pembeli
              </p>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                user123
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
