'use client';

// frontend/src/app/portal/page.tsx
// Öğrenci e-posta + şifre ile giriş → /portal/[id]'ye yönlendir

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function PortalLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/auth/student-login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Giriş başarısız');
      }

      const { access_token, student } = data;

      // Session'ı kaydet
      localStorage.setItem('bilsem_portal_session', JSON.stringify({
        studentId: student.id,
        token:     access_token,
      }));

      // Portal sayfasına yönlendir
      router.push(`/portal/${student.id}`);

    } catch (err: any) {
      setError(err.message || 'E-posta veya şifre hatalı');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-violet-500 rounded-2xl mb-4 shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-gray-900">BİLSEM Öğrenci Portalı</h1>
          <p className="text-gray-500 text-sm mt-1">E-posta ve şifrenizle giriş yapın</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] p-6">
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  placeholder="ornek@mail.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Giriş yapılıyor...</>
                : 'Giriş Yap'
              }
            </button>
          </form>
        </div>

        {/* Alt linkler */}
        <div className="text-center mt-5 space-y-2">
          <p className="text-xs text-gray-400">
            Hesabın yok mu?{' '}
            <a href="/kayit" className="text-brand-500 hover:underline font-medium">Kayıt ol</a>
          </p>
          <p className="text-xs text-gray-400">
            <a href="/login" className="text-gray-400 hover:underline">Öğretmen girişi</a>
          </p>
          <p className="text-xs text-gray-300 mt-3">Altıeylül BİLSEM • Öğrenci Portalı</p>
        </div>

      </div>
    </div>
  );
}
