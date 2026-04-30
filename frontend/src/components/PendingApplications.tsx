'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Mail, School, User, X } from 'lucide-react';

type PendingStudent = {
  id: string;
  name: string;
  surname: string;
  school: string;
  grade: number;
  level: string;
  bilsemLevel: string;
  parentEmail?: string;
  registerNotes?: string;
  registeredAt: string;
  user?: { email: string };
};

const CONTEXT_LABEL: Record<string, string> = {
  BILSEM:   '🏫 BİLSEM',
  OKUL:     '📚 Okul',
  OZELDERS: '🎯 Özel Ders',
};

export default function PendingApplications() {
  const [items, setItems]     = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingStudent | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  async function load() {
    try {
      const token = document.cookie.match(/bilsem_token=([^;]+)/)?.[1] || '';
      const res = await fetch(`${apiUrl}/auth/pending-students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function approve(studentId: string) {
    setApproving(studentId);
    try {
      const token = document.cookie.match(/bilsem_token=([^;]+)/)?.[1] || '';
      const res = await fetch(`${apiUrl}/auth/approve-student/${studentId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSelected(null);
        await load();
      }
    } catch {
      alert('Onaylama başarısız');
    } finally {
      setApproving(null);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading || items.length === 0) return null;

  return (
    <>
      <div className="card p-5 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Onay Bekleyen Kayıtlar
              </h3>
              <p className="text-xs text-gray-400">{items.length} yeni öğrenci kaydoldu</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            {items.length} bekliyor
          </span>
        </div>

        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.06]"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-violet-400 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(s.name?.[0] || '') + (s.surname?.[0] || '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {s.name} {s.surname}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <School className="w-3 h-3" />{s.school}
                  </span>
                  <span className="text-xs text-gray-400">• {s.grade}. Sınıf</span>
                  {s.user?.email && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[140px]">{s.user.email}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setSelected(s)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700">
                  Detay
                </button>
                <button
                  onClick={() => approve(s.id)}
                  disabled={approving === s.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCircle className="w-3 h-3" />
                  {approving === s.id ? '...' : 'Onayla'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detay Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="card w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Öğrenci Detayı</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-violet-400 rounded-xl flex items-center justify-center text-white text-base font-bold">
                {(selected.name?.[0] || '') + (selected.surname?.[0] || '')}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selected.name} {selected.surname}
                </p>
                <p className="text-xs text-gray-400">{selected.user?.email}</p>
              </div>
            </div>

            <div className="space-y-2 mb-5 text-sm">
              {[
                ['Okul',          selected.school],
                ['Sınıf',         `${selected.grade}. Sınıf`],
                ['Kademe',        selected.level === 'ILKOGRETIM' ? 'İlköğretim' : 'Lise'],
                ['BİLSEM Seviyesi', selected.bilsemLevel],
                ['Veli E-posta',  selected.parentEmail || '—'],
                ['Kayıt Tarihi',  selected.registeredAt ? new Date(selected.registeredAt).toLocaleDateString('tr-TR') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-right">{v}</span>
                </div>
              ))}
              {selected.registerNotes && (
                <div className="pt-2 border-t border-black/[0.06]">
                  <p className="text-xs text-gray-400 mb-1">Not</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{selected.registerNotes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                Kapat
              </button>
              <button
                onClick={() => approve(selected.id)}
                disabled={approving === selected.id}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {approving === selected.id ? 'Onaylanıyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
