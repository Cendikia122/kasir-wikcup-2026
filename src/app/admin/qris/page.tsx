'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '@/lib/utils';
import { Printer } from 'lucide-react';

const QRIS_BASE = `00020101021226590014COM.GO-JEK.WWW011893600915006220100702150622010040303UMI520459995303360`;

export default function AdminQRIS() {
  const [amount, setAmount] = useState<number>(0);
  const [label, setLabel] = useState('Bazar Wikcup 2026');
  const [color, setColor] = useState('#18181b');

  const qrisValue = `${QRIS_BASE}5402${amount > 0 ? String(amount).padStart(2, '0') : '00'}5802ID5910${label.slice(0, 10).padEnd(10, ' ')}6013BOGOR SELATAN6304ABCD`;

  const presets = [5000, 10000, 15000, 18000, 20000, 50000];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">QRIS Payment</h1>
        <p className="text-sm text-zinc-500">Generate QR Code untuk pembayaran stand</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
            <div>
              <label className="text-xs text-zinc-500 font-medium block mb-1.5">Nominal Pembayaran (Rp)</label>
              <input
                type="number"
                min="0"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0 = Open Amount"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {presets.map((n) => (
                <button
                  key={n}
                  onClick={() => setAmount(n)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${amount === n ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                >
                  {formatRupiah(n)}
                </button>
              ))}
              <button onClick={() => setAmount(0)} className="px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-100 hover:bg-zinc-200">
                Open
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-500 font-medium block mb-1.5">Label Toko</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={25}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 font-medium block mb-1.5">Warna QR</label>
              <div className="flex gap-2">
                {['#18181b', '#1d4ed8', '#047857', '#b91c1c', '#7c3aed'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${color === c ? 'border-zinc-400 scale-110' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-zinc-200 text-sm rounded-xl hover:bg-zinc-50 transition-colors"
            >
              <Printer size={16} /> Cetak QR Code
            </button>
          </div>
        </div>

        {/* QR Preview */}
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col items-center gap-4 w-full print-qr">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">QRIS — Scan untuk Bayar</p>
            <div className="p-4 border-2 rounded-2xl" style={{ borderColor: color }}>
              <QRCodeSVG
                value={qrisValue}
                size={200}
                fgColor={color}
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-xl">{amount > 0 ? formatRupiah(amount) : 'Sesuai Pesanan'}</p>
              <p className="text-sm text-zinc-500 mt-1">{label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">SMK Wikrama Bogor · Wikcup 2026</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-3 text-center">
            Tunjukkan QR ini ke pembeli untuk dipindai menggunakan aplikasi dompet digital (GoPay, OVO, Dana, dll.)
          </p>
        </div>
      </div>
    </div>
  );
}
