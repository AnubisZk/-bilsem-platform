'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Lock, BookOpen, Clock,
  MessageSquare, Star, ChevronDown, LogOut, Target, Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, getInitials, formatRelativeDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'bilsem_portal_session';

export default function StudentPortalPage() {
  const params = useParams();
  const id = params.id as string;
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  // Sayfa açılınca localStorage'dan oturum kontrol et
  useEffect(() => {
    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Sadece aynı öğrencinin oturumu geçerli
        if (parsed.studentId === id && parsed.token) {
          fetchPortalData(parsed.token);
          return;
        }
      } catch {}
    }
    setLoading(false);
  }, [id]);

  async function fetchPortalData(token: string) {
    try {
      const res = await api.get(`/students/${id}/portal-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentData(res.data);
      setIsLoggedIn(true);
    } catch {
      // Token geçersiz, oturumu temizle
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const loginRes = await api.post('/auth/student-login', { studentId: id, password });
      const { access_token, student } = loginRes.data;

      // localStorage'a kaydet
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        studentId: id,
        token: access_token,
      }));

      await fetchPortalData(access_token);
      toast.success(`Hoş geldin, ${student.name}!`);
    } catch {
      toast.error('Şifre hatalı');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setIsLoggedIn(false);
    setStudentData(null);
    setPassword('');
  }

  // Yükleniyor
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-violet-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Login ekranı
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-violet-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-violet-500 rounded-2xl mb-4 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display text-gray-900">BİLSEM Öğrenci Portalı</h1>
            <p className="text-gray-500 text-sm mt-1">Öğrenci girişi</p>
          </div>
          <div className="card p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Şifreniz: Ad ve soyadınızın baş harfleri + 2026</p>
              </div>
              <button type="submit" disabled={loginLoading} className="btn-primary w-full justify-center py-3">
                {loginLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </span>
                ) : 'Giriş Yap'}
              </button>
            </form>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Altıeylül BİLSEM • Öğrenci Portalı</p>
        </motion.div>
      </div>
    );
  }

  // Portal içeriği
  const plan = studentData?.groupStudents?.[0]?.group?.plans?.[0];
  const planItems: any[] = plan?.planItems || [];
  const weekSet = new Set<number>();
  planItems.forEach((item: any) => weekSet.add(Number(item.week)));
  const weeks = Array.from(weekSet).sort((a, b) => a - b);
  const totalActivities = studentData?.studentLogs?.length || 0;
  const avgPerf = totalActivities > 0
    ? studentData.studentLogs.reduce((s: number, l: any) => s + l.performance, 0) / totalActivities
    : 0;

  return (
    <div className="min-h-screen bg-[#f5f5f3]">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.06] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-violet-500 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 font-display">BİLSEM Portalı</p>
              <p className="text-xs text-gray-400">{studentData.name} {studentData.surname}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost py-1.5 px-3 text-sm text-red-400">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Karşılama */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-violet-400 flex items-center justify-center text-white text-lg font-bold">
              {getInitials(studentData.name, studentData.surname)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold font-display text-gray-900">Merhaba, {studentData.name}! 👋</h2>
              <p className="text-sm text-gray-500">{studentData.school} • {studentData.grade}. Sınıf • {studentData.mathLevel}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-black/[0.04]">
            <div className="text-center">
              <p className="text-xl font-bold font-display text-brand-500">{totalActivities}</p>
              <p className="text-xs text-gray-400">Etkinlik</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-display text-emerald-500">{avgPerf.toFixed(1)}/5</p>
              <p className="text-xs text-gray-400">Performans</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-display text-amber-500">{weeks.length}</p>
              <p className="text-xs text-gray-400">Hafta</p>
            </div>
          </div>
        </motion.div>

        {/* Çalışma Planı */}
        {plan ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-gray-900">Çalışma Planım</h3>
              <span className="badge badge-brand text-xs ml-auto">{plan.title}</span>
            </div>
            <div className="space-y-2">
              {weeks.map((week: number) => {
                const weekItems = planItems.filter((item: any) => Number(item.week) === week);
                const isExpanded = expandedWeek === week;
                return (
                  <div key={week} className="border border-black/[0.06] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedWeek(isExpanded ? null : week)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-7 h-7 bg-brand-500 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{week}</div>
                      <span className="font-medium text-sm text-gray-900">{week}. Hafta</span>
                      <span className="text-xs text-gray-400 ml-auto">{weekItems.length} konu</span>
                      <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="divide-y divide-black/[0.04]">
                            {weekItems.map((item: any) => (
                              <div key={item.id} className="px-4 py-3">
                                <div className="flex items-start gap-3">
                                  <Target className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">{item.topic}</p>
                                    {(item.objectives || []).slice(0, 2).map((obj: string, i: number) => (
                                      <p key={i} className="text-xs text-gray-400 mt-0.5">• {obj}</p>
                                    ))}
                                    {item.activity && (
                                      <div className="mt-2 p-2 bg-brand-50 rounded-lg">
                                        <p className="text-xs text-brand-600 flex items-center gap-1">
                                          <BookOpen className="w-3 h-3" />{item.activity.title}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{item.duration} dk
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div className="card p-8 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">Henüz çalışma planı atanmadı</p>
            <p className="text-sm mt-1">Öğretmeniniz yakında bir plan oluşturacak</p>
          </div>
        )}

        {/* Etkinlikler */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-gray-900">Etkinliklerim</h3>
          </div>
          <div className="space-y-2">
            {(studentData.studentLogs || []).slice(0, 8).map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {log.activityLog?.activity?.title || log.activityLog?.topic}
                  </p>
                  <p className="text-xs text-gray-400">{formatRelativeDate(log.activityLog?.date)}</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn('w-3 h-3', i < log.performance ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
                  ))}
                </div>
              </div>
            ))}
            {(studentData.studentLogs || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Henüz etkinlik kaydın yok</p>
            )}
          </div>
        </motion.div>

        {/* Geri Bildirimler */}
        {(studentData.feedbacks || []).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-gray-900">Öğretmen Geri Bildirimleri</h3>
            </div>
            {studentData.feedbacks.map((fb: any) => (
              <div key={fb.id} className="p-4 bg-gradient-to-r from-brand-50 to-violet-50 rounded-xl mb-3">
                <p className="text-xs font-semibold text-brand-600 mb-2">{fb.period}</p>
                <p className="text-[10px] font-semibold uppercase text-emerald-600 mb-1">Güçlü Yönlerin</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{fb.strengths}</p>
                <p className="text-[10px] font-semibold uppercase text-amber-600 mb-1">Gelişim Alanların</p>
                <p className="text-xs text-gray-700 leading-relaxed">{fb.improvements}</p>
                {fb.motivation && (
                  <p className="text-xs text-brand-700 italic mt-2 p-2 bg-white/50 rounded-lg">💬 {fb.motivation}</p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
