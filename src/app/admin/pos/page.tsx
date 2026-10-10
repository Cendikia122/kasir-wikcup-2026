'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { getStored, setStored, StorageKeys } from '@/lib/seeder';
import { getSession } from '@/lib/auth';
import { Product, Order, CartItem, PaymentMethod } from '@/types';
import { formatRupiah, generateReceiptNo, formatTime } from '@/lib/utils';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  Printer,
  Share2,
  X,
  Banknote,
  QrCode,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export default function AdminPosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [buyerName, setBuyerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cashierName, setCashierName] = useState('Kasir');

  useEffect(() => {
    setProducts(getStored<Product[]>(StorageKeys.PRODUCTS, []));
    const s = getSession();
    if (s?.name) setCashierName(s.name);
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['Semua', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'Semua' || p.category === category;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  const totalAmount = useMemo(
    () => cart.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [cart]
  );
  const totalItems = useMemo(
    () => cart.reduce((s, i) => s + i.quantity, 0),
    [cart]
  );

  const cashNum = Number(cashInput.replace(/\D/g, '')) || 0;
  const change = Math.max(0, cashNum - totalAmount);
  const canCheckout =
    cart.length > 0 && (paymentMethod !== 'cash' || cashNum >= totalAmount);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const exist = prev.find((i) => i.product.id === product.id);
      if (exist) {
        if (exist.quantity >= product.stock) {
          alert(`Stok ${product.name} hanya tersisa ${product.stock}`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const newQty = i.quantity + delta;
            if (newQty > i.product.stock) {
              alert(`Stok hanya tersisa ${i.product.stock}`);
              return i;
            }
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashInput('');
    setBuyerName('');
  };

  const handleCheckout = () => {
    if (!canCheckout) return;

    // Decrement stock
    const updatedProducts = products.map((p) => {
      const item = cart.find((c) => c.product.id === p.id);
      return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
    });
    setProducts(updatedProducts);
    setStored(StorageKeys.PRODUCTS, updatedProducts);

    // Create Order
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      receiptNo: generateReceiptNo(),
      buyerName: buyerName.trim() || 'Pembeli Stand',
      items: cart.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        hpp: i.product.hpp,
        quantity: i.quantity,
        subtotal: i.product.price * i.quantity,
      })),
      totalAmount,
      paymentMethod,
      status: 'paid',
      createdAt: new Date().toISOString(),
      cashierName,
      cashReceived: paymentMethod === 'cash' ? cashNum : totalAmount,
      change: paymentMethod === 'cash' ? change : 0,
    };

    const existingOrders = getStored<Order[]>(StorageKeys.ORDERS, []);
    setStored(StorageKeys.ORDERS, [newOrder, ...existingOrders]);

    // Sync to Google Sheet in background
    const sheetUrl = getStored<string>(StorageKeys.SHEET_URL, '');
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_order', order: newOrder, sheetUrl }),
    }).catch(() => {});

    setCompletedOrder(newOrder);
    setShowReceiptModal(true);
    clearCart();
  };

  const QRIS_DATA = `00020101021126590014COM.GO-JEK.WWW011893600915006220100702150622010040303UMI5204599953033605402105802ID5910BAZAR WIKCUP6013BOGOR SELATAN61054162262490125${totalAmount}0703A016304C3E5`;

  const getReceiptText = (order: Order) => {
    let text = `==============================\n`;
    text += `   BAZAR WIKCUP 2026\n`;
    text += `   SMK WIKRAMA BOGOR\n`;
    text += `==============================\n`;
    text += `No. Struk : ${order.receiptNo}\n`;
    text += `Waktu     : ${formatTime(order.createdAt)}\n`;
    text += `Kasir     : ${order.cashierName || 'Kasir'}\n`;
    text += `Pembeli   : ${order.buyerName}\n`;
    text += `------------------------------\n`;
    order.items.forEach((item) => {
      text += `${item.productName}\n`;
      text += `  ${item.quantity} x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal)}\n`;
    });
    text += `------------------------------\n`;
    text += `TOTAL     : ${formatRupiah(order.totalAmount)}\n`;
    text += `Metode    : ${order.paymentMethod.toUpperCase()}\n`;
    if (order.paymentMethod === 'cash') {
      text += `Tunai     : ${formatRupiah(order.cashReceived || 0)}\n`;
      text += `Kembali   : ${formatRupiah(order.change || 0)}\n`;
    }
    text += `==============================\n`;
    text += `Terima kasih atas kunjungannya!\n`;
    text += `Sukseskan Wikcup 2026 🎉\n`;
    return text;
  };

  const copyReceipt = async (order: Order) => {
    try {
      await navigator.clipboard.writeText(getReceiptText(order));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Gagal menyalin struk');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>Kasir / POS Cepat</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Jaga: {cashierName}
            </span>
          </h1>
          <p className="text-xs text-zinc-500">
            Klik produk untuk menambah ke pesanan pembeli dengan cepat
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Products Grid (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Search & Category Filter */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-3 space-y-2.5">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk atau kode..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    category === c
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Product cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filtered.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              const outOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !outOfStock && addToCart(product)}
                  className={`bg-white rounded-xl border border-zinc-100 overflow-hidden flex flex-col justify-between transition-all select-none ${
                    outOfStock
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-zinc-900 hover:shadow-xs cursor-pointer active:scale-98'
                  }`}
                >
                  <div className="relative h-24 bg-zinc-100 w-full">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                        📦
                      </div>
                    )}
                    <span
                      className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        outOfStock
                          ? 'bg-red-500 text-white'
                          : product.stock <= 5
                          ? 'bg-amber-500 text-white'
                          : 'bg-black/60 text-white'
                      }`}
                    >
                      {outOfStock ? 'Habis' : `Stok: ${product.stock}`}
                    </span>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {product.code}
                      </p>
                      <h4 className="text-xs font-bold leading-tight text-zinc-800 line-clamp-1">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-zinc-900">
                        {formatRupiah(product.price)}
                      </span>
                      {inCart ? (
                        <span className="h-5 w-5 bg-zinc-900 text-white text-[10px] font-bold rounded-md flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <span className="h-5 w-5 bg-zinc-100 text-zinc-600 rounded-md flex items-center justify-center hover:bg-zinc-200">
                          <Plus size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Cart & Fast Checkout (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-xs sticky top-4 flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-emerald-400" />
                <span className="font-bold text-sm">Pesanan Pengunjung</span>
                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                  {totalItems} item
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Cart item list */}
            <div className="p-3 overflow-y-auto max-h-[220px] divide-y divide-zinc-50 space-y-2">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Klik produk di sebelah kiri untuk menambah ke pesanan
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-800 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {formatRupiah(item.product.price)} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-5 h-5 rounded bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-5 h-5 rounded bg-zinc-900 text-white hover:bg-zinc-700 flex items-center justify-center"
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-zinc-300 hover:text-red-500 ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <div className="p-3 bg-zinc-50 border-t border-zinc-100 space-y-3">
                {/* Buyer Name */}
                <div>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Nama Pembeli / Kelas (opsional)"
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'cash', label: 'Tunai', icon: <Banknote size={13} /> },
                    { id: 'qris', label: 'QRIS', icon: <QrCode size={13} /> },
                    { id: 'transfer', label: 'Transfer', icon: <CreditCard size={13} /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                        paymentMethod === m.id
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {m.icon}
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Cash Handling */}
                {paymentMethod === 'cash' && (
                  <div className="bg-white p-2.5 rounded-xl border border-zinc-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">Uang Diterima:</span>
                      <input
                        type="number"
                        min="0"
                        value={cashInput}
                        onChange={(e) => setCashInput(e.target.value)}
                        placeholder="0"
                        className="w-28 text-right font-mono font-bold text-xs p-1 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setCashInput(String(totalAmount))}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-white"
                      >
                        Pas
                      </button>
                      {[5000, 10000, 20000, 50000, 100000].map((nom) => (
                        <button
                          key={nom}
                          type="button"
                          onClick={() => setCashInput(String(nom))}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        >
                          {nom >= 1000 ? `${nom / 1000}k` : nom}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-zinc-100 flex justify-between text-xs">
                      <span className="text-zinc-500">Kembalian:</span>
                      <span
                        className={`font-bold ${
                          cashNum < totalAmount ? 'text-red-500' : 'text-emerald-600'
                        }`}
                      >
                        {cashNum < totalAmount
                          ? `Kurang ${formatRupiah(totalAmount - cashNum)}`
                          : formatRupiah(change)}
                      </span>
                    </div>
                  </div>
                )}

                {/* QRIS Quick Scan */}
                {paymentMethod === 'qris' && (
                  <div className="bg-white p-3 rounded-xl border border-zinc-200 flex flex-col items-center gap-2">
                    <p className="text-[11px] text-zinc-500">
                      Tunjukkan QR ke pembeli untuk discan:
                    </p>
                    <div className="p-2 border rounded-xl bg-white">
                      <QRCodeSVG value={QRIS_DATA} size={110} />
                    </div>
                    <span className="font-bold text-xs text-zinc-800">
                      Total: {formatRupiah(totalAmount)}
                    </span>
                  </div>
                )}

                {/* Total & Checkout Button */}
                <div className="pt-1 flex items-baseline justify-between text-xs">
                  <span className="font-bold text-zinc-600">TOTAL:</span>
                  <span className="font-black text-base text-zinc-900">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Selesaikan & Cetak Struk</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceiptModal && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-zinc-200">
            <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between no-print">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Sparkles size={14} className="text-yellow-400" />
                Transaksi Berhasil
              </span>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Thermal Receipt */}
            <div className="p-4 bg-zinc-50 flex justify-center max-h-[60vh] overflow-y-auto">
              <div
                id="thermal-receipt"
                className="w-full max-w-[280px] bg-white p-4 rounded-lg border border-zinc-200 font-mono text-[11px] leading-relaxed text-zinc-800"
              >
                <div className="text-center border-b border-dashed border-zinc-300 pb-2 mb-2">
                  <p className="font-bold text-xs uppercase">BAZAR WIKCUP 2026</p>
                  <p className="text-[10px] text-zinc-500">SMK WIKRAMA BOGOR</p>
                </div>

                <div className="space-y-0.5 border-b border-dashed border-zinc-300 pb-2 mb-2 text-[10px] text-zinc-600">
                  <div className="flex justify-between">
                    <span>No. Struk:</span>
                    <span className="font-bold text-zinc-900">
                      {completedOrder.receiptNo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>{formatTime(completedOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{completedOrder.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pembeli:</span>
                    <span>{completedOrder.buyerName}</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-zinc-300 pb-2 mb-2 space-y-1">
                  {completedOrder.items.map((it, idx) => (
                    <div key={idx}>
                      <div className="font-bold">{it.productName}</div>
                      <div className="flex justify-between text-[10px] text-zinc-600">
                        <span>
                          {it.quantity} x {formatRupiah(it.price)}
                        </span>
                        <span className="font-bold text-zinc-900">
                          {formatRupiah(it.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-0.5 border-b border-dashed border-zinc-300 pb-2 mb-2 text-[10px]">
                  <div className="flex justify-between font-bold text-xs text-zinc-900 pt-0.5">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(completedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Metode:</span>
                    <span className="uppercase font-semibold">
                      {completedOrder.paymentMethod}
                    </span>
                  </div>
                  {completedOrder.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between text-zinc-600">
                        <span>Tunai:</span>
                        <span>{formatRupiah(completedOrder.cashReceived || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>Kembali:</span>
                        <span>{formatRupiah(completedOrder.change || 0)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center text-[9px] text-zinc-400 space-y-0.5 pt-1">
                  <p>Terima kasih telah berbelanja!</p>
                  <p>#SuksesWikcup2026</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-white border-t border-zinc-100 flex flex-col gap-2 no-print">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} /> Cetak Struk
                </button>
                <button
                  type="button"
                  onClick={() => copyReceipt(completedOrder)}
                  className="py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check size={14} /> Tersalin!
                    </span>
                  ) : (
                    <>
                      <Share2 size={14} /> Salin WA
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs"
              >
                Transaksi Baru (Pengunjung Berikutnya)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
