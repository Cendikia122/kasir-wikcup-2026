'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSession, clearSession } from '@/lib/auth';
import { runSeeder, getStored, setStored, StorageKeys } from '@/lib/seeder';
import { Product, CartItem } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { ShoppingCart, X, LogOut, ChevronRight, Minus, Plus } from 'lucide-react';

export default function UserPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [category, setCategory] = useState('Semua');
  const [session, setSession] = useState<{ name: string } | null>(null);

  useEffect(() => {
    runSeeder();
    const s = getSession();
    if (!s) { router.push('/login'); return; }
    setSession(s);
    setProducts(getStored<Product[]>(StorageKeys.PRODUCTS, []));
  }, [router]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['Semua', ...Array.from(cats)];
  }, [products]);

  const filtered = category === 'Semua' ? products : products.filter((p) => p.category === category);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stock) return prev;
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    sessionStorage.setItem('wik_cart', JSON.stringify(cart));
    router.push('/checkout');
  };

  const handleLogout = () => {
    clearSession();
    document.cookie = 'wik_session=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-sm">🛍️ Bazar Wikcup 2026</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-zinc-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-lg font-bold">Halo, {session?.name} 👋</h2>
          <p className="text-sm text-zinc-500">Apa yang mau kamu beli hari ini?</p>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => {
            const inCart = cart.find((i) => i.product.id === product.id);
            const outOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl overflow-hidden border border-zinc-100 ${outOfStock ? 'opacity-50' : ''}`}
              >
                {/* Product image */}
                <div className="relative w-full h-36 bg-zinc-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                    unoptimized
                  />
                  {outOfStock && (
                    <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Habis</span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-[11px] text-zinc-400 mb-0.5">{product.category}</p>
                  <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold">{formatRupiah(product.price)}</span>
                    {!outOfStock && (
                      inCart ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(product.id, -1)}
                            className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{inCart.quantity}</span>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-6 h-6 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-700 rounded-lg transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-7 h-7 flex items-center justify-center bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Cart Sidebar Overlay */}
      {cartOpen && (
        <div className="fixed inset-0 z-30 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-white flex flex-col">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold">Keranjang</h3>
              <button onClick={() => setCartOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-sm">
                  Keranjang kosong
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-zinc-500">{formatRupiah(item.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center bg-zinc-100 rounded-lg">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item.product)} className="w-6 h-6 flex items-center justify-center bg-zinc-900 text-white rounded-lg">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-zinc-100">
              <div className="flex justify-between text-sm font-bold mb-3">
                <span>Total</span>
                <span>{formatRupiah(cartTotal)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Lanjut Bayar <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
