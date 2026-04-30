'use client';

import { useState } from 'react';
import { Brain, CheckCircle, Mail, Lock, User, School, ChevronRight, Eye, EyeOff } from 'lucide-react';

const PROGRAMS = [
  { value: 'BILSEM',    label: 'BİLSEM',             desc: 'Altıeylül BİLSEM öğrencisiyim' },
  { value: 'OKUL',      label: 'Okul Destek',         desc: 'Okul ders desteği alıyorum' },
  { value: 'OZELDERS',  label: 'Özel Ders',           desc: 'Bireysel özel ders alıyorum' },
];

type Step = 1 | 2 | 3;

export default function KayitPage() {
  const [step, setStep]           = useState<Step>(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [resultEmail, setResultEmail] = useState('');

  const [form, setForm] = useState({
    name:        '',
    surname:     '',
    email:       '',
    password:    '',
    password2:   '',
    school:      '',
    grade:       '5',
    level:       'ILKOGRETIM',
    bilsemLevel: 'Özel Yetenekli 1',
    program:     'BILSEM',
    parentEmail: '',
    note:        '',
  });

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setError('');
  }

  function validateStep(): string {
    if (step === 1) {
      if (!form.name.trim())    return 'Ad gerekli';
      if (!form.surname.trim()) return 'Soyad gerekli';
      if (!form.email.includes('@')) return 'Geçerli e-posta girin';
      if (form.password.length < 8)  return 'Şifre en az 8 karakter olmalı';
      if (form.password !== form.password2) return 'Şifreler eşleşmiyor';
    }
    if (step === 2) {
      if (!form.school.trim()) return 'Okul adı gerekli';
    }
    return '';
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setStep((s) => (s + 1) as Step);
  }

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/auth/student-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        form.name.trim(),
          surname:     form.surname.trim(),
          email:       form.email.toLowerCase().trim(),
          password:    form.password,
          school:      form.school.trim(),
          grade:       Number(form.grade),
          level:       form.level,
          bilsemLevel: form.bilsemLevel,
          context:     form.program,
          parentEmail: form.parentEmail || undefined,
          notes:       form.note || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kayıt başarısız');

      setResultEmail(form.email);
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  // ── Tamamlandı ekranı ──────────────────────────────────────────────────────
  if (done) return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4">
      <div className="max-w-md w-full bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-white">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Kaydınız Alındı!</h1>
        <p className="text-slate-300 mb-2 text-sm leading-relaxed">
          Öğretmeniniz hesabınızı onayladıktan sonra aşağıdaki bilgilerle giriş yapabilirsiniz:
        </p>
        <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">E-posta</span>
            <span className="font-medium">{resultEmail}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Şifre</span>
            <span className="font-medium">Kayıt sırasında belirlediğiniz şifre</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Giriş adresi</span>
            <span className="font-medium text-indigo-300">/portal/[öğrenci-id]</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Onay e-postası gönderildiğinde portal bağlantınız öğretmeniniz tarafından iletilecektir.
        </p>
        <a href="/" className="inline-block w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 font-semibold transition-colors">
          Ana sayfaya dön
        </a>
      </div>
    </main>
  );

  // ── Kayıt formu ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white px-4 py-10">
      <div className="max-w-lg mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl mb-4 shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">BİLSEM Platformu</h1>
          <p className="text-slate-400 text-sm mt-1">Öğrenci Kaydı</p>
        </div>

        {/* Adım göstergesi */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step  ? 'bg-emerald-500 text-white' :
                s === step ? 'bg-indigo-500 text-white' :
                             'bg-white/10 text-slate-400'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 mx-1 ${s < step ? 'bg-emerald-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/10 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">

          {/* ── Adım 1: Hesap bilgileri ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-1">Hesap Bilgileri</h2>
                <p className="text-slate-400 text-sm">Portala giriş için kullanacağınız bilgiler</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Ad *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                      placeholder="Zeynep" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Soyad *</label>
                  <input value={form.surname} onChange={e => set('surname', e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                    placeholder="Yıldız" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">E-posta *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                    placeholder="zeynep@ornek.com" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Şifre * (en az 8 karakter)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Şifre Tekrar *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" value={form.password2} onChange={e => set('password2', e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                    placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}

          {/* ── Adım 2: Eğitim bilgileri ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-1">Eğitim Bilgileri</h2>
                <p className="text-slate-400 text-sm">Okul ve sınıf bilgileriniz</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Okul *</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={form.school} onChange={e => set('school', e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                    placeholder="Atatürk Ortaokulu" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Sınıf *</label>
                  <select value={form.grade} onChange={e => set('grade', e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={i+1} className="bg-slate-800">{i+1}. Sınıf</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Kademe *</label>
                  <select value={form.level} onChange={e => set('level', e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                    <option value="ILKOGRETIM" className="bg-slate-800">Ortaokul</option>
                    <option value="LISE" className="bg-slate-800">Lise</option>
                  </select>
                </div>
              </div>


              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">BİLSEM Öğrencisi misiniz?</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => set('program', 'BILSEM')}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form.program === 'BILSEM' ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                    ✓ Evet, BİLSEM öğrencisiyim
                  </button>
                  <button type="button" onClick={() => { set('program', 'OKUL'); set('bilsemLevel', ''); }}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form.program !== 'BILSEM' ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                    ✗ Hayır
                  </button>
                </div>
              </div>

              {form.program === 'BILSEM' && <div>
                <label className="text-xs text-slate-400 mb-1.5 block">BİLSEM Kademesi</label>
                <select value={form.bilsemLevel} onChange={e => set('bilsemLevel', e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                  <option className="bg-slate-800">Özel Yetenekli 1</option>
                  <option className="bg-slate-800">Özel Yetenekli 2</option>
                  <option className="bg-slate-800">Özel Yetenekli 3</option>
                  <option className="bg-slate-800">Lise</option>
                </select>
              </div>}

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Veli E-postası (opsiyonel)</label>
                <input type="email" value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                  placeholder="veli@ornek.com" />
              </div>
            </div>
          )}

          {/* ── Adım 3: Program seçimi ────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-1">Program Seçimi</h2>
                <p className="text-slate-400 text-sm">Hangi programa katılıyorsunuz?</p>
              </div>

              <div className="space-y-2">
                {PROGRAMS.map(p => (
                  <button key={p.value} type="button" onClick={() => set('program', p.value)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      form.program === p.value
                        ? 'border-indigo-400 bg-indigo-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      form.program === p.value ? 'border-indigo-400 bg-indigo-400' : 'border-slate-500'
                    }`} />
                    <div>
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-slate-400">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Not (opsiyonel)</label>
                <textarea value={form.note} onChange={e => set('note', e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-500 resize-none"
                  rows={3} placeholder="Öğretmeninize iletmek istediğiniz notlar..." />
              </div>

              {/* Özet */}
              <div className="bg-white/5 rounded-2xl p-4 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-slate-400 mb-2">KAYIT ÖZETİ</p>
                {[
                  ['Ad Soyad', `${form.name} ${form.surname}`],
                  ['E-posta', form.email],
                  ['Okul', form.school],
                  ['Sınıf', `${form.grade}. Sınıf`],
                  ['Program', PROGRAMS.find(p => p.value === form.program)?.label],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hata */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as Step)}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 font-medium transition-colors text-sm">
                Geri
              </button>
            )}
            {step < 3 ? (
              <button onClick={next}
                className="flex-1 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 font-semibold transition-colors text-sm flex items-center justify-center gap-2">
                Devam <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={submit} disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 font-semibold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kaydediliyor...</>
                  : 'Kaydı Tamamla'
                }
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Zaten hesabın var mı?{' '}
          <a href="/login" className="text-indigo-400 hover:underline">Öğretmen girişi</a>
        </p>
      </div>
    </main>
  );
}
