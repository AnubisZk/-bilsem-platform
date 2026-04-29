'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Mail, School, Target, UserPlus } from 'lucide-react';

type Application = {
  id: string;
  createdAt: string;
  status: string;
  name: string;
  email: string;
  grade: string;
  goal: string;
  program: string;
  note?: string;
};

export default function PendingApplications() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadApplications() {
    try {
      const res = await fetch('http://localhost:3001/api/applications');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Başvurular alınamadı:', err);
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: string) {
    await fetch(`http://localhost:3001/api/applications/${id}/approve`, {
      method: 'PUT',
    });
    await loadApplications();
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const pending = items.filter((x) => x.status === 'PENDING');

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            Bekleyen Öğrenci Başvuruları
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Kayıt formundan gelen öğrencileri buradan takip edebilirsiniz.
          </p>
        </div>

        <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
          {pending.length} bekleyen
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          Başvurular yükleniyor...
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          Şu anda bekleyen başvuru yok.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{app.name}</h3>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {app.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <School className="h-4 w-4 text-slate-400" />
                      {app.grade}
                    </p>
                    <p className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-slate-400" />
                      {app.program}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {new Date(app.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>

                  {app.goal && (
                    <p className="mt-3 text-sm text-slate-700">
                      <strong>Hedef:</strong> {app.goal}
                    </p>
                  )}

                  {app.note && (
                    <p className="mt-2 text-sm text-slate-700">
                      <strong>Not:</strong> {app.note}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => approve(app.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
                >
                  <CheckCircle className="h-4 w-4" />
                  Onayla
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
