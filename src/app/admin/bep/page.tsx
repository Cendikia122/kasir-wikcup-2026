'use client';

import { useState, useEffect } from 'react';
import { getStored, setStored, StorageKeys } from '@/lib/seeder';
import { Product, Order } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface FixedCost { id: string; name: string; amount: number; }

export default function AdminBep() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [costName, setCostName] = useState('');
  const [costAmount, setCostAmount] = useState('');

  useEffect(() => {
    setProducts(getStored<Product[]>(StorageKeys.PRODUCTS, []));
    setOrders(getStored<Order[]>(StorageKeys.ORDERS, []));
    setCosts(getStored<FixedCost[]>(StorageKeys.FIXED_COSTS, []));
  }, []);

  const totalFixedCost = costs.reduce((s, c) => s + c.amount, 0);
  const paidOrders = orders.filter((o) => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCogs = paidOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.hpp * i.quantity, 0), 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalFixedCost;
  const totalSold = paidOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  // Weighted average margin
  const avgMargin = totalSold > 0 ? grossProfit / totalSold : products.reduce((s, p) => s + (p.price - p.hpp), 0) / Math.max(1, products.length);
  const bepUnit = avgMargin > 0 ? Math.ceil(totalFixedCost / avgMargin) : 0;
  const bepProgress = bepUnit > 0 ? Math.min(100, Math.round((totalSold / bepUnit) * 100)) : 0;
  const reached = netProfit >= 0 && totalSold > 0;

  const addCost = () => {
    if (!costName || !costAmount) return;
    const newCosts = [...costs, { id: `fc-${Date.now()}`, name: costName, amount: Number(costAmount) }];
    setCosts(newCosts);
    setStored(StorageKeys.FIXED_COSTS, newCosts);
    setCostName(''); setCostAmount('');
  };

  const removeCost = (id: string) => {
    const updated = costs.filter((c) => c.id !== id);
    setCosts(updated);
    setStored(StorageKeys.FIXED_COSTS, updated);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Analisis BEP</h1>
        <p className="text-sm text-zinc-500">Break Even Point hari ini</p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl p-5 ${reached ? 'bg-emerald-900' : 'bg-zinc-900'} text-white`}>
        <p className="text-sm font-medium opacity-70">{reached ? '🎉 Sudah Balik Modal!' : 'Progress Menuju BEP'}</p>
        <p className="text-3xl font-black mt-1">{bepProgress}%</p>
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-emerald-400' : 'bg-amber-400'}`}
            style={{ width: `${bepProgress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs opacity-60">
          <span>Terjual: {totalSold} unit</span>
          <span>Target: {bepUnit} unit</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Omset', value: formatRupiah(totalRevenue) },
          { label: 'Total HPP Modal', value: formatRupiah(totalCogs) },
          { label: 'Laba Kotor', value: formatRupiah(grossProfit), highlight: true },
          { label: 'Biaya Tetap', value: formatRupiah(totalFixedCost) },
          { label: 'Laba Bersih', value: formatRupiah(netProfit), highlight: true, positive: netProfit >= 0 },
          { label: 'Target BEP', value: `${bepUnit} unit` },
        ].map(({ label, value, highlight, positive }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-100 p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-lg font-bold mt-1 ${highlight ? (positive ?? true) ? 'text-emerald-600' : 'text-red-600' : 'text-zinc-900'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Fixed Costs */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold">Biaya Tetap Operasional Stand</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {costs.map((c) => (
            <div key={c.id} className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm">{c.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatRupiah(c.amount)}</span>
                <button onClick={() => removeCost(c.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-zinc-100 flex gap-2">
          <input
            type="text"
            placeholder="Nama biaya..."
            value={costName}
            onChange={(e) => setCostName(e.target.value)}
            className="flex-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <input
            type="number"
            placeholder="Rp"
            value={costAmount}
            onChange={(e) => setCostAmount(e.target.value)}
            className="w-28 px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <button onClick={addCost} className="px-3 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
