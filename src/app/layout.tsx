import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bazar Wikcup 2026',
  description: 'Sistem kasir bazar Wikrama Cup 2026',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
