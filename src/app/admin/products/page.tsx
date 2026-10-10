'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getStored, setStored, StorageKeys, SEED_PRODUCTS } from '@/lib/seeder';
import { Product } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

type FormData = Omit<Product, 'id'>;
const BLANK: FormData = { code: '', name: '', category: 'Makanan', price: 0, hpp: 0, stock: 0, imageUrl: '', description: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<FormData>(BLANK);

  useEffect(() => {
    setProducts(getStored<Product[]>(StorageKeys.PRODUCTS, []));
  }, []);

  const persist = (updated: Product[]) => {
    setProducts(updated);
    setStored(StorageKeys.PRODUCTS, updated);
  };

  const openNew = () => {
    setIsNew(true);
    setEditing(null);
    setForm({ ...BLANK, code: `P-${(products.length + 1).toString().padStart(2, '0')}` });
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setIsNew(false);
    setForm({ code: p.code, name: p.name, category: p.category, price: p.price, hpp: p.hpp, stock: p.stock, imageUrl: p.imageUrl, description: p.description ?? '' });
  };

  const handleSave = () => {
    if (!form.name || form.price <= 0) { alert('Nama & harga wajib diisi'); return; }
    if (isNew) {
      const newP: Product = { id: `p-${Date.now()}`, ...form };
      persist([...products, newP]);
    } else if (editing) {
      persist(products.map((p) => p.id === editing.id ? { ...editing, ...form } : p));
    }
    setIsNew(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    persist(products.filter((p) => p.id !== id));
  };

  const handleRestock = (id: string) => {
    const qty = Number(prompt('Tambah berapa stok?', '10'));
    if (!qty || qty <= 0) return;
    persist(products.map((p) => p.id === id ? { ...p, stock: p.stock + qty } : p));
  };

  const modalOpen = isNew || !!editing;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Produk</h1>
          <p className="text-sm text-zinc-500">{products.length} item terdaftar</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => {
          const margin = p.price - p.hpp;
          const marginPct = p.price > 0 ? Math.round((margin / p.price) * 100) : 0;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="relative h-40 bg-zinc-100">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-300 text-4xl">📦</div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => openEdit(p)} className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white shadow-sm">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white shadow-sm text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.stock <= 5 ? 'bg-red-500 text-white' : 'bg-black/60 text-white'}`}>
                    Stok: {p.stock}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[11px] text-zinc-400">{p.category} · {p.code}</p>
                <h3 className="text-sm font-semibold mt-0.5">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{formatRupiah(p.price)}</p>
                    <p className="text-[11px] text-emerald-600">+{formatRupiah(margin)} ({marginPct}%)</p>
                  </div>
                  <button onClick={() => handleRestock(p.id)} className="text-xs px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium transition-colors">
                    + Stok
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm">{isNew ? 'Tambah Produk' : 'Edit Produk'}</h2>
              <button onClick={() => { setIsNew(false); setEditing(null); }} className="p-1 hover:bg-zinc-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              {/* Image preview */}
              {form.imageUrl && (
                <div className="relative h-32 rounded-xl overflow-hidden bg-zinc-100">
                  <Image src={form.imageUrl} alt="preview" fill className="object-cover" unoptimized />
                </div>
              )}

              {[
                { key: 'name', label: 'Nama Produk', placeholder: 'Es Teh Jumbo', type: 'text' },
                { key: 'code', label: 'Kode', placeholder: 'MIN-01', type: 'text' },
                { key: 'imageUrl', label: 'URL Gambar', placeholder: 'https://...', type: 'url' },
                { key: 'description', label: 'Deskripsi (opsional)', placeholder: '...', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs text-zinc-500 font-medium block mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs text-zinc-500 font-medium block mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                >
                  {['Makanan', 'Minuman', 'Camilan', 'Merchandise', 'Lainnya'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'hpp', label: 'HPP / Modal (Rp)' },
                  { key: 'price', label: 'Harga Jual (Rp)' },
                  { key: 'stock', label: 'Stok Awal' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-zinc-500 font-medium block mb-1">{label}</label>
                    <input
                      type="number"
                      min="0"
                      value={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => { setIsNew(false); setEditing(null); }} className="flex-1 py-2.5 border border-zinc-200 text-sm rounded-xl hover:bg-zinc-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-zinc-900 text-white text-sm rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5">
                <Check size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
