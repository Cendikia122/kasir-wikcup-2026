'use client';

import { useState, useEffect } from 'react';
import { getStored, setStored, StorageKeys } from '@/lib/seeder';
import { Order } from '@/types';
import { formatRupiah, formatTime } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Printer, Trash2, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setOrders(getStored<Order[]>(StorageKeys.ORDERS, []));
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm('Hapus pesanan ini?')) return;
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    setStored(StorageKeys.ORDERS, updated);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = orders.map((o) => [
      o.receiptNo,
      formatTime(o.createdAt),
      o.buyerName,
      o.cashierName || 'Kasir',
      o.paymentMethod.toUpperCase(),
      o.totalAmount,
      o.status === 'paid' ? 'LUNAS' : o.status.toUpperCase(),
      o.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', '),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([
      ['No. Struk', 'Waktu', 'Pembeli', 'Kasir', 'Metode', 'Total (Rp)', 'Status', 'Rincian Item'],
      ...rows,
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Transaksi');
    XLSX.writeFile(wb, `Laporan_Kasir_Wikcup2026_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalRevenue = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Pesanan</h1>
          <p className="text-sm text-zinc-500">{orders.length} transaksi · Omset: <span className="font-semibold text-zinc-900">{formatRupiah(totalRevenue)}</span></p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={15} /> Download Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 text-xs font-medium rounded-xl hover:bg-zinc-50 transition-colors"
          >
            <Printer size={15} /> Cetak
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 py-16 text-center text-sm text-zinc-400">
          Belum ada pesanan masuk
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div
                className="px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{order.buyerName}</p>
                    <span className="font-mono text-[11px] text-zinc-400">{order.receiptNo}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatTime(order.createdAt)} · {order.paymentMethod.toUpperCase()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{formatRupiah(order.totalAmount)}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {order.status === 'paid' ? 'Lunas' : 'Batal'}
                  </span>
                </div>
                <div className="text-zinc-400">
                  {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expanded === order.id && (
                <div className="border-t border-zinc-50 px-4 pb-4 pt-3 space-y-3">
                  <div className="space-y-1.5">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-zinc-600">{item.productName} <span className="text-zinc-400">×{item.quantity}</span></span>
                        <span className="font-medium">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  {order.paymentMethod === 'cash' && order.cashReceived != null && (
                    <div className="pt-2 border-t border-zinc-50 text-xs text-zinc-500 flex justify-between">
                      <span>Diterima: {formatRupiah(order.cashReceived)}</span>
                      <span>Kembali: {formatRupiah(order.change ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button onClick={() => handleDelete(order.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
