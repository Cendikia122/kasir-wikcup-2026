'use client';

import { useState, useEffect } from 'react';
import { getStored, setStored, StorageKeys } from '@/lib/seeder';
import { Order } from '@/types';
import {
  FileSpreadsheet,
  Check,
  Copy,
  ExternalLink,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'add_order';

    // 1. TAMBAH SATU PESANAN
    if (action === 'add_order' && data.order) {
      var sheet = getOrCreateOrdersSheet(ss);
      appendOrderRow(sheet, data.order);
      return jsonResponse({ status: 'success', message: 'Pesanan berhasil dicatat' });
    }

    // 2. SINKRONKAN SEMUA PESANAN
    if (action === 'sync_all' && data.orders && data.orders.length > 0) {
      var sheet = getOrCreateOrdersSheet(ss);
      data.orders.forEach(function(ord) {
        appendOrderRow(sheet, ord);
      });
      return jsonResponse({ status: 'success', count: data.orders.length });
    }

    // 3. TES KONEKSI
    if (action === 'test') {
      var sheet = getOrCreateOrdersSheet(ss);
      sheet.appendRow([
        'TEST-001',
        new Date().toLocaleString('id-ID'),
        'Uji Coba Sistem',
        'Admin',
        'TUNAI',
        10000,
        'Lunas',
        'Koneksi Berhasil Terhubung!'
      ]);
      return jsonResponse({ status: 'success', message: 'Tes koneksi berhasil' });
    }

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', error: err.toString() });
  }
}

function doGet(e) {
  return jsonResponse({ status: 'connected', time: new Date() });
}

function getOrCreateOrdersSheet(ss) {
  var sheet = ss.getSheetByName('Pesanan');
  if (!sheet) {
    sheet = ss.insertSheet('Pesanan');
    sheet.appendRow([
      'No. Struk',
      'Waktu',
      'Nama Pembeli',
      'Kasir',
      'Metode Bayar',
      'Total (Rp)',
      'Status',
      'Rincian Item'
    ]);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendOrderRow(sheet, o) {
  var itemsText = (o.items || []).map(function(i) {
    return i.productName + ' (' + i.quantity + 'x)';
  }).join(', ');

  sheet.appendRow([
    o.receiptNo || '-',
    o.createdAt || new Date().toISOString(),
    o.buyerName || 'Pembeli',
    o.cashierName || 'Kasir',
    (o.paymentMethod || 'cash').toUpperCase(),
    o.totalAmount || 0,
    o.status === 'paid' ? 'LUNAS' : o.status,
    itemsText
  ]);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export default function AdminSheetPage() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const savedUrl = getStored<string>(StorageKeys.SHEET_URL, '');
    setSheetUrl(savedUrl);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sheetUrl.trim();
    setStored(StorageKeys.SHEET_URL, clean);
    setSaved(true);
    setStatusMsg({ type: 'success', text: 'URL Google Sheet berhasil disimpan!' });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!sheetUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Masukkan URL Web App Google Sheet terlebih dahulu!' });
      return;
    }
    setTesting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', sheetUrl: sheetUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: 'Berhasil! Baris uji coba telah otomatis masuk ke Google Spreadsheet Anda.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: `Gagal terhubung: ${data.error || 'Pastikan izin akses diset ke Anyone'}`,
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Gagal: ${err?.message || 'Periksa koneksi internet'}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncAllOrders = async () => {
    if (!sheetUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Masukkan URL Web App Google Sheet terlebih dahulu!' });
      return;
    }
    const orders = getStored<Order[]>(StorageKeys.ORDERS, []);
    if (orders.length === 0) {
      setStatusMsg({ type: 'error', text: 'Belum ada data pesanan lokal untuk disinkronkan.' });
      return;
    }

    setSyncing(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all', orders, sheetUrl: sheetUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: `Sukses! ${orders.length} pesanan lokal berhasil dikirim ke Google Spreadsheet.`,
        });
      } else {
        setStatusMsg({ type: 'error', text: `Gagal sinkronisasi: ${data.error || 'Coba lagi'}` });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Gagal: ${err?.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Gagal menyalin');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="text-emerald-600" size={24} />
          <span>Koneksi Google Spreadsheet</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Hubungkan aplikasi kasir ini ke Google Sheets agar setiap penjualan tercatat otomatis dan bisa dipantau bersama
        </p>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* URL Input Card */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">URL Web App Google Apps Script</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              URL deployment berakhiran <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-[11px]">/exec</code>
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
              sheetUrl
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${sheetUrl ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            {sheetUrl ? 'Terkonfigurasi' : 'Belum Terhubung'}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {saved ? <Check size={14} className="text-emerald-400" /> : null}
              <span>{saved ? 'Tersimpan!' : 'Simpan URL'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !sheetUrl.trim()}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={13} />
              <span>{testing ? 'Menguji...' : 'Uji Koneksi (Test Kirim)'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllOrders}
              disabled={syncing || !sheetUrl.trim()}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Semua Pesanan Lokal'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Step by Step Guide */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">Cara Menghubungkan ke Google Spreadsheet (Hanya 3 Menit)</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Ikuti 5 langkah mudah berikut tanpa perlu akun Google Cloud berbayar
          </p>
        </div>

        <ol className="space-y-3 text-xs text-zinc-700 list-decimal list-inside">
          <li className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 leading-relaxed">
            <strong>Buat Spreadsheet Baru:</strong> Buka{' '}
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5"
            >
              sheets.new <ExternalLink size={12} />
            </a>{' '}
            di Google Drive Anda, beri nama dokumen misalnya <em>"Database Kasir Wikcup 2026"</em>.
          </li>

          <li className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 leading-relaxed">
            <strong>Buka Apps Script:</strong> Di Google Sheets tersebut, klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
          </li>

          <li className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 leading-relaxed">
            <strong>Tempel Kode Script:</strong> Hapus seluruh kode yang ada di layar Apps Script, lalu salin dan tempelkan kode yang ada di bawah ini.
          </li>

          <li className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 leading-relaxed">
            <strong>Deploy sebagai Web App:</strong>
            <div className="mt-1.5 pl-2 space-y-1 text-zinc-600">
              <p>• Klik tombol biru <strong>Terapkan (Deploy)</strong> di pojok kanan atas &gt; pilih <strong>Deployment baru (New deployment)</strong>.</p>
              <p>• Klik ikon roda gigi (Settings) &gt; pilih jenis <strong>Aplikasi web (Web app)</strong>.</p>
              <p>• Jalankan sebagai (Execute as): <strong>Saya (Me)</strong>.</p>
              <p>• Yang memiliki akses (Who has access): <strong>Siapa saja (Anyone)</strong> (<em>Penting agar web kasir bisa mengirim data</em>).</p>
              <p>• Klik <strong>Terapkan (Deploy)</strong> dan setujui izin akses akun Google Anda.</p>
            </div>
          </li>

          <li className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-emerald-950 leading-relaxed">
            <strong>Salin URL & Simpan:</strong> Salin <strong>URL Aplikasi Web</strong> yang dihasilkan (berakhiran <code>/exec</code>), lalu tempelkan ke kolom input di atas dan klik <strong>Simpan URL</strong>.
          </li>
        </ol>
      </div>

      {/* Code Box */}
      <div className="bg-zinc-900 text-white rounded-2xl overflow-hidden shadow-md">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-yellow-400" />
            <span className="text-xs font-bold text-zinc-200">Kode Google Apps Script (Code.gs)</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Salin Kode Script</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 text-[11px] font-mono leading-relaxed text-zinc-300 overflow-x-auto max-h-72">
          {APPS_SCRIPT_CODE}
        </pre>
      </div>
    </div>
  );
}
