import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, MessageCircle, Sparkles, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* Header Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider text-slate-900 leading-none">
              SFV APPAREL
            </span>
            <span className="text-[10px] font-semibold text-blue-600 tracking-tight">
              KILANG CETAK JERSI & DTF
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-2xs"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Laman Utama</span>
        </Link>
      </header>

      {/* Main 404 Content */}
      <main className="w-full max-w-xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-50 to-blue-100 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-inner">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">404</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Halaman Tidak Dijumpai
        </h1>
        <p className="text-sm text-slate-600 max-w-md mb-8 leading-relaxed">
          Maaf, halaman atau rekaan yang anda cari mungkin telah dipindahkan, dipadam, atau pautan yang dimasukkan kurang tepat.
        </p>

        {/* Quick Nav Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-8">
          <Link
            href="/catalog"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Katalog Jersi & Baju
              </div>
              <div className="text-[11px] text-slate-500">Lihat rekaan terkini kilang</div>
            </div>
          </Link>

          <a
            href="https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20mencari%20bantuan%20rekaan%20jersi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Bantuan WhatsApp
              </div>
              <div className="text-[11px] text-slate-500">Hubungi jurujual kilang</div>
            </div>
          </a>
        </div>

        {/* Primary Action Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Laman Utama</span>
        </Link>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 border-t border-slate-200 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SFV APPAREL (SFV Ventures Marketing). Hak Cipta Terpelihara.
      </footer>
    </div>
  );
}
