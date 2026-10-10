'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStored, StorageKeys } from '@/lib/seeder';
import { Product, Order } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { TrendingUp, ShoppingBag, PackageCheck, AlertTriangle, ShoppingCart } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setProducts(getStored<Product[]>(StorageKeys.PRODUCTS, []));
    setOrders(getStored<Order[]>(StorageKeys.ORDERS, []));
  }, []);

  const totalRevenue = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders = orders.filter((o) => o.status === 'paid').length;
  const totalItems = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const lowStock = products.filter((p) => p.stock <= 5);

  const stats = [
    { label: 'Total Omset', value: formatRupiah(totalRevenue), icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Total Pesanan', value: totalOrders, icon: ShoppingBag, color: 'text-blue-600' },
    { label: 'Item Terjual', value: `${totalItems} pcs`, icon: PackageCheck, color: 'text-purple-600' },
    { label: 'Stok Menipis', value: lowStock.length, icon: AlertTriangle, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-500">Bazar Wikcup 2026 — Ringkasan Hari Ini</p>
        </div>
        <button
          onClick={() => router.push('/admin/pos')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs active:scale-98"
        >
          <ShoppingCart size={16} /> Buka Kasir (POS)
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-zinc-100">
            <div className={`mb-2 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Warning */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Stok Menipis!
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span key={p.id} className="text-xs bg-white border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full font-medium">
                {p.name} ({p.stock})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold">Pesanan Terbaru</p>
        </div>
        {orders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-400">Belum ada pesanan</div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{order.buyerName}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{order.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatRupiah(order.totalAmount)}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {order.status === 'paid' ? 'Lunas' : order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
