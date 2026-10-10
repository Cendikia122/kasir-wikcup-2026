'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { getSession } from '@/lib/auth';
import { getStored, setStored, StorageKeys } from '@/lib/seeder';
import { CartItem, Order, Product } from '@/types';
import { formatRupiah, generateReceiptNo, formatTime } from '@/lib/utils';
import { ArrowLeft, Banknote, QrCode, Check } from 'lucide-react';

type PayMethod = 'cash' | 'qris' | 'transfer';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<{ name: string } | null>(null);
  const [method, setMethod] = useState<PayMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [done, setDone] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/login'); return; }
    setSession(s);
    setBuyerName(s.name);

    const raw = sessionStorage.getItem('wik_cart');
    if (!raw) { router.push('/'); return; }
    setCart(JSON.parse(raw));
  }, [router]);

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cashNum = Number(cashInput.replace(/\D/g, '')) || 0;
  const change = Math.max(0, cashNum - total);
  const canPay = method !== 'cash' || cashNum >= total;

  const QRIS_DATA = `00020101021126590014COM.GO-JEK.WWW011893600915006220100702150622010040303UMI5204599953033605402105802ID5910BAZAR WIKCUP6013BOGOR SELATAN61054162262490125${total}0703A016304C3E5`;

  const handlePay = () => {
    const products = getStored<Product[]>(StorageKeys.PRODUCTS, []);
    const updatedProducts = products.map((p) => {
      const item = cart.find((c) => c.product.id === p.id);
      return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
    });
    setStored(StorageKeys.PRODUCTS, updatedProducts);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      receiptNo: generateReceiptNo(),
      buyerName: buyerName || session?.name || 'Pembeli',
      items: cart.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        hpp: i.product.hpp,
        quantity: i.quantity,
        subtotal: i.product.price * i.quantity,
      })),
      totalAmount: total,
      paymentMethod: method,
      status: 'paid',
      createdAt: new Date().toISOString(),
      cashierName: session?.name,
      cashReceived: method === 'cash' ? cashNum : total,
      change: method === 'cash' ? change : 0,
    };

    const orders = getStored<Order[]>(StorageKeys.ORDERS, []);
    setStored(StorageKeys.ORDERS, [newOrder, ...orders]);
    sessionStorage.removeItem('wik_cart');

    // Sync to Google Sheet in background
    const sheetUrl = getStored<string>(StorageKeys.SHEET_URL, '');
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_order', order: newOrder, sheetUrl }),
    }).catch(() => {});

    setOrder(newOrder);
    setDone(true);
  };

  if (done && order) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-zinc-100 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="text-emerald-600" size={26} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Pembayaran Berhasil!</h2>
            <p className="text-sm text-zinc-500 mt-1">No. Struk: <span className="font-mono font-bold text-zinc-900">{order.receiptNo}</span></p>
          </div>
          <div className="text-left bg-zinc-50 rounded-xl p-4 space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="text-zinc-600">{item.productName} x{item.quantity}</span>
                <span className="font-medium">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatRupiah(order.totalAmount)}</span>
            </div>
            {order.paymentMethod === 'cash' && (
              <div className="flex justify-between text-zinc-500">
                <span>Kembalian</span>
                <span>{formatRupiah(order.change ?? 0)}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Kembali Belanja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-zinc-100 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold text-sm">Pembayaran</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-semibold">Ringkasan Pesanan</p>
          </div>
          <div className="p-4 space-y-2">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                  <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" unoptimized />
                </div>
                <span className="flex-1 text-sm truncate">{item.product.name} <span className="text-zinc-400">x{item.quantity}</span></span>
                <span className="text-sm font-medium">{formatRupiah(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-zinc-100 pt-2 flex justify-between font-bold">
              <span className="text-sm">Total</span>
              <span className="text-sm">{formatRupiah(total)}</span>
            </div>
          </div>
        </div>

        {/* Buyer Name */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4">
          <label className="text-xs text-zinc-500 font-medium block mb-2">Nama Pembeli</label>
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="Nama kamu..."
          />
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-semibold">Metode Bayar</p>
          </div>
          <div className="p-4 space-y-2">
            {(
              [
                { id: 'cash', label: 'Tunai / Cash', icon: <Banknote size={18} /> },
                { id: 'qris', label: 'QRIS', icon: <QrCode size={18} /> },
                { id: 'transfer', label: 'Transfer Bank', icon: <QrCode size={18} /> },
              ] as { id: PayMethod; label: string; icon: React.ReactNode }[]
            ).map((m) => (
              <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${method === m.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-300'}`}>
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="sr-only" />
                <span className="text-zinc-600">{m.icon}</span>
                <span className="text-sm font-medium">{m.label}</span>
                {method === m.id && <Check size={16} className="ml-auto text-zinc-900" />}
              </label>
            ))}
          </div>
        </div>

        {/* Tunai: Uang diterima */}
        {method === 'cash' && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
            <label className="text-xs text-zinc-500 font-medium block">Uang yang Diterima</label>
            <input
              type="number"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
            />
            <div className="flex gap-2 flex-wrap">
              {[5000, 10000, 20000, 50000, 100000].map((n) => (
                <button key={n} onClick={() => setCashInput(String(n))} className="px-3 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium transition-colors">
                  {n >= 1000 ? `${n / 1000}rb` : n}
                </button>
              ))}
              <button onClick={() => setCashInput(String(total))} className="px-3 py-1 text-xs bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors">
                Uang Pas
              </button>
            </div>
            {cashNum > 0 && cashNum >= total && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Kembalian</span>
                <span className="font-bold text-emerald-600">{formatRupiah(change)}</span>
              </div>
            )}
          </div>
        )}

        {/* QRIS */}
        {method === 'qris' && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col items-center gap-4">
            <p className="text-sm text-zinc-500">Scan QR Code untuk membayar</p>
            <div className="p-4 border-2 border-zinc-900 rounded-2xl">
              <QRCodeSVG value={QRIS_DATA} size={180} />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{formatRupiah(total)}</p>
              <p className="text-xs text-zinc-400">Tujuan: Stand Bazar Wikcup 2026</p>
            </div>
          </div>
        )}

        {/* Transfer */}
        {method === 'transfer' && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
            <p className="text-sm font-semibold">Info Transfer</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Bank</span>
                <span className="font-medium">BCA / BRI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">No. Rekening</span>
                <span className="font-mono font-bold">1234-5678-9012</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Atas Nama</span>
                <span className="font-medium">Panitia Wikcup</span>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-2">
                <span className="text-zinc-500">Nominal</span>
                <span className="font-bold text-emerald-600">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={!canPay || cart.length === 0}
          className="w-full py-4 bg-zinc-900 text-white text-sm font-semibold rounded-2xl hover:bg-zinc-800 transition-colors disabled:opacity-40 sticky bottom-4"
        >
          {method === 'cash' ? `Konfirmasi Bayar ${formatRupiah(total)}` : 'Konfirmasi Pembayaran'}
        </button>
      </main>
    </div>
  );
}
