import Link from 'next/link';
import { Brain, BarChart3, BookOpen, Sparkles, Users, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <section className="mx-auto max-w-7xl px-6 py-20">
        <nav className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Bilsem Math Intelligence</h1>
              <p className="text-xs text-indigo-200">AI destekli öğrenme platformu</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/login" className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              Giriş Yap
            </Link>
            <Link href="/kayit" className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold">
              Başla
            </Link>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-300/20 text-indigo-100 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Kişiye özel matematik öğrenme sistemi
            </div>

            <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Her öğrenci için akıllı çalışma yolu.
            </h2>

            <p className="text-lg text-slate-300 leading-8 mb-8 max-w-xl">
              BİLSEM, okul, özel ders, LGS, TYT-AYT ve olimpiyat hazırlığını tek panelde birleştiren;
              kaynak, soru, performans ve AI planlama odaklı yeni nesil eğitim platformu.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="px-7 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 transition font-bold shadow-xl">
                Öğretmen Girişi
              </Link>
              <Link href="/portal" className="px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition font-bold shadow-xl">
                Öğrenci Girişi
              </Link>
              <Link href="/login" className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition font-bold border border-white/10">
                Raporları Gör
              </Link>
            </div>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Öğrenci Takibi', Users],
                ['AI Planlama', Sparkles],
                ['Soru Bankası', BookOpen],
                ['Raporlama', BarChart3],
                ['PDF Kaynak', FileText],
                ['Analitik', Brain],
              ].map(([title, Icon]: any) => (
                <div key={title} className="rounded-2xl bg-white/10 p-5 border border-white/10">
                  <Icon className="w-7 h-7 text-indigo-300 mb-4" />
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs text-slate-300 mt-2">Akıllı modül</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
