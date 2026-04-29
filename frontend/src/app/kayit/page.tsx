'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, CheckCircle, Mail, User, School, Target } from 'lucide-react';

export default function KayitPage() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch('http://localhost:3001/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      alert('Başvuru gönderilemedi');
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-950 text-white px-6">
        <div className="max-w-md w-full bg-white/10 border border-white/10 rounded-3xl p-8 text-center">
          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-5" />
          <h1 className="text-2xl font-bold mb-3">Başvurunuz alındı</h1>
          <p className="text-slate-300 mb-6">
            Bilgileriniz öğretmen/admin tarafından incelendikten sonra hesabınız aktif edilecektir.
          </p>
          <Link href="/" className="inline-block px-5 py-3 rounded-xl bg-indigo-500 font-semibold">
            Ana sayfaya dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-200 mb-8">
          ← Ana sayfa
        </Link>

        <div className="bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Öğrenci Başvurusu</h1>
              <p className="text-sm text-slate-300">Mail ile ön kayıt formu</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field icon={<User />} label="Ad Soyad" name="name" placeholder="Örn. Ayşe Yılmaz" />
              <Field icon={<Mail />} label="E-posta" name="email" type="email" placeholder="ornek@mail.com" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field icon={<School />} label="Sınıf" name="grade" placeholder="7. sınıf" />
              <Field icon={<Target />} label="Hedef" name="goal" placeholder="LGS / TYT / BİLSEM / Olimpiyat" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">Program Türü</label>
              <select name="program" className="mt-2 w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none">
                <option>BİLSEM</option>
                <option>Okul Destek</option>
                <option>Özel Ders</option>
                <option>LGS Hazırlık</option>
                <option>TYT-AYT Hazırlık</option>
                <option>Matematik Olimpiyatı</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">Kısa Not</label>
              <textarea
                name="note"
                rows={4}
                placeholder="Eksik konular, hedef, mevcut durum..."
                className="mt-2 w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none"
              />
            </div>

            <button className="w-full rounded-2xl bg-indigo-500 hover:bg-indigo-400 transition px-6 py-4 font-bold">
              Başvuruyu Gönder
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ icon, label, name, placeholder, type = 'text' }: any) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-200">{label}</label>
      <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/10 border border-white/10 px-4 py-3">
        <span className="text-indigo-300 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
        <input
          name={name}
          type={type}
          required
          placeholder={placeholder}
          className="w-full bg-transparent outline-none placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}
