'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearSession, getSession } from '@/lib/auth';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Target,
  LogOut,
  QrCode,
  FileSpreadsheet,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/admin/pos', label: 'Kasir (POS)', icon: ShoppingCart },
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/orders', label: 'Pesanan', icon: Receipt },
  { href: '/admin/bep', label: 'BEP', icon: Target },
  { href: '/admin/qris', label: 'QRIS', icon: QrCode },
  { href: '/admin/sheet', label: 'Google Sheet', icon: FileSpreadsheet },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== 'admin') {
      router.push('/login?redirect=admin');
      return;
    }
    setName(s.name);
  }, [router]);

  const handleLogout = () => {
    clearSession();
    document.cookie = 'wik_session=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-zinc-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-zinc-900 text-white flex flex-col transform transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
      >
        <div className="px-5 py-5 border-b border-zinc-800">
          <p className="font-bold text-sm">🛍️ Wikcup 2026</p>
          <p className="text-xs text-zinc-400 mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                onClick={() => { router.push(href); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left
                  ${active ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-zinc-300">{name}</p>
            <p className="text-[11px] text-zinc-500">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-zinc-100 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-zinc-100 rounded-lg">
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold">Admin — Wikcup 2026</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
