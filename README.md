# Sistem Kasir & Keuangan Bazar Wikcup 2026 🎉

Aplikasi Point of Sale (POS), Cetak Struk, Manajemen Stok, dan Penghitung BEP (Break Even Point) khusus untuk **Bazar Wikcup 2026** (Penilaian Mata Pelajaran KIK - SMK Wikrama Bogor).

## ✨ Fitur Utama
1. **Kasir (Point of Sale)**:
   - Input barang terjual secara cepat (klik/tap produk, atur kuantitas, pencarian & filter kategori).
   - Kalkulator pembayaran tunai otomatis (Uang Pas, pecahan Rp10.000, Rp20.000, Rp50.000, Rp100.000) beserta metode QRIS & Transfer.
   - Mencatat nama pembeli dan nama petugas kasir yang sedang bertugas (mendukung pergantian shift).
2. **Cetak Struk Thermal & Format WhatsApp**:
   - Desain struk ukuran printer thermal (58mm/80mm) lengkap dengan identitas Rombel dan Stand.
   - **Cetak Langsung / Simpan PDF** melalui tombol `Cetak Struk`.
   - **Salin Teks Struk WA** untuk langsung dikirim ke WhatsApp pembeli atau grup kelas.
3. **Manajemen Stok & Harga Barang**:
   - Stok berkurang otomatis setiap transaksi selesai.
   - Peringatan otomatis (*Low Stock Alert*) jika stok tersisa $\le 5$ porsi/cup.
   - Tombol **Restock Cepat (+5 / +10)** saat tim Produksi/Logistik mengantar stok tambahan ke stand.
   - Perhitungan HPP (Modal) dan Margin Keuntungan per unit maupun persentase.
4. **Penghitung BEP (Break Even Point) Hari Itu**:
   - Menghitung target penjualan minimal (**BEP Unit** & **BEP Rupiah**) secara *real-time*.
   - Sudah memasukkan **Biaya Pendaftaran Stand (Rp20.000)** serta biaya dekorasi dan *trash bag* yang dapat disesuaikan.
   - Indikator *Progress Bar* menuju Balik Modal dan perhitungan **Laba Bersih Kas Rombel**.
5. **Database Excel (.xlsx)**:
   - **Download Database Lengkap (.xlsx)**: Menghasilkan file Excel berisi 5 Sheet (`Ringkasan Laporan`, `Riwayat Transaksi`, `Detail Produk Terjual`, `Katalog & Stok`, `Biaya Tetap & BEP`).
   - **Import Produk dari Excel**: Unggah file Excel untuk memasukkan daftar produk dan stok awal sekaligus.
   - **Unduh Template Excel**: Tersedia template siap isi.
   - **Penyimpanan Lokal Otomatis**: Seluruh data tersimpan di browser sehingga aman meskipun sinyal internet di lapangan tidak stabil.
6. **Checklist Aturan & Pencegahan Denda Wikcup**:
   - Pengingat aturan kebersihan stand (cegah denda Rp40.000) dan pengembalian fasilitas sekolah (cegah sanksi Rp25.000), serta akses cepat ke Google Spreadsheet pengumpulan foto produk & poster.

---

## 🚀 Cara Menjalankan di Komputer Lokal

```bash
npm install
npm run dev
```
Buka `http://localhost:3000` di browser.

---

## 🌐 Cara Hosting / Deploy ke Vercel (Gratis)

Aplikasi ini dibangun menggunakan **Next.js**, framework resmi dari **Vercel**, sehingga dapat langsung di-hosting tanpa konfigurasi tambahan:

### Cara 1: Lewat GitHub (Direkomendasikan)
1. Buat repository baru di GitHub dan unggah (*push*) seluruh isi folder `kasir-wikcup-2026`.
2. Buka [vercel.com](https://vercel.com) dan login.
3. Klik **Add New...** $\rightarrow$ **Project** $\rightarrow$ Pilih repository GitHub tersebut.
4. Klik **Deploy** (pengaturan *Framework Preset: Next.js* akan terdeteksi otomatis).
5. Dalam $\pm 1$ menit, link aplikasi kasir siap dibuka di HP/Laptop seluruh petugas kasir rombel!

### Cara 2: Lewat Vercel CLI
```bash
npx vercel
```
Ikuti instruksi di terminal hingga link produksi muncul.
