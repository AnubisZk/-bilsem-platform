'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Lock, BookOpen, Clock, MessageSquare, Star,
  ChevronDown, LogOut, CheckCircle, FileText, Save, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, getInitials, formatRelativeDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'bilsem_portal_session';

const CONTEXTS = [
  { key: 'BILSEM',   label: 'BİLSEM',    icon: '🏫', color: 'brand' },
  { key: 'OKUL',     label: 'Okul',       icon: '📚', color: 'emerald' },
  { key: 'OZELDERS', label: 'Özel Ders',  icon: '🎯', color: 'amber' },
] as const;

type ContextKey = typeof CONTEXTS[number]['key'];

// ─── PROGRESS FORM ────────────────────────────────────────────────────────────
function ProgressForm({ item, token, onSave }: any) {
  const existing = item.progress?.[0] || {};
  const [form, setForm] = useState({
    isCompleted:    existing.isCompleted    || false,
    solvedCount:    existing.solvedCount    || 0,
    correctCount:   existing.correctCount   || 0,
    wrongCount:     existing.wrongCount     || 0,
    blankCount:     existing.blankCount     || 0,
    difficultyLevel:existing.difficultyLevel|| '',
    studentNote:    existing.studentNote    || '',
  });
  const [saving, setSaving] = useState(false);
  const successRate = form.solvedCount > 0
    ? Math.round((form.correctCount / form.solvedCount) * 100) : 0;

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/portal/plan-items/${item.id}/progress`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Kaydedildi!');
      onSave();
    } catch { toast.error('Kaydedilemedi'); }
    finally { setSaving(false); }
  }

  return (
    <div className="mt-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.06] space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tamamlandı</label>
        <button onClick={() => setForm({ ...form, isCompleted: !form.isCompleted })}
          className={cn('w-12 h-6 rounded-full transition-colors relative',
            form.isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <div className={cn('w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform',
            form.isCompleted ? 'translate-x-6' : 'translate-x-0.5'
          )} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[['Çözdüm','solvedCount'],['Doğru','correctCount'],['Yanlış','wrongCount'],['Boş','blankCount']].map(([label, key]) => (
          <div key={key}>
            <label className="text-[10px] text-gray-500 block mb-1">{label}</label>
            <input type="number" min="0" value={(form as any)[key]}
              onChange={e => setForm({ ...form, [key]: Number(e.target.value) })}
              className="w-full text-center text-sm font-bold p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-brand-400"
            />
          </div>
        ))}
      </div>

      {form.solvedCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Başarı Oranı</span>
            <span className={cn('text-xs font-bold',
              successRate >= 80 ? 'text-emerald-500' : successRate >= 60 ? 'text-amber-500' : 'text-red-500'
            )}>%{successRate}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div className={cn('rounded-full h-2 transition-all',
              successRate >= 80 ? 'bg-emerald-500' : successRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
            )} style={{ width: `${successRate}%` }} />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-gray-500 block mb-1.5">Bu konu benim için...</label>
        <div className="flex gap-2">
          {['KOLAY','ORTA','ZOR'].map(d => (
            <button key={d} onClick={() => setForm({ ...form, difficultyLevel: d })}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                form.difficultyLevel === d
                  ? d === 'KOLAY' ? 'bg-emerald-500 text-white'
                  : d === 'ORTA'  ? 'bg-amber-500 text-white'
                  :                 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              )}
            >
              {d === 'KOLAY' ? '😊 Kolay' : d === 'ORTA' ? '🤔 Orta' : '😓 Zor'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Notum</label>
        <textarea value={form.studentNote}
          onChange={e => setForm({ ...form, studentNote: e.target.value })}
          className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 resize-none focus:outline-none focus:border-brand-400"
          rows={2} placeholder="Bu konuda notlarım..." />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center text-sm py-2">
        <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}

// ─── PLAN ITEM ────────────────────────────────────────────────────────────────
function PlanItem({ item, token, onUpdate }: any) {
  const [showForm, setShowForm] = useState(false);
  const prog = item.progress?.[0];
  const isCompleted = prog?.isCompleted;
  const successRate = prog?.solvedCount > 0
    ? Math.round((prog.correctCount / prog.solvedCount) * 100) : null;

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-all',
      isCompleted
        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10'
        : 'border-black/[0.06] dark:border-white/[0.06]'
    )}>
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setShowForm(!showForm)}
          className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
          )}
        >
          {isCompleted && <CheckCircle className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowForm(!showForm)}>
          <p className={cn('text-sm font-medium',
            isCompleted ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-gray-900 dark:text-white'
          )}>{item.topic}</p>
          {item.subtopic && <p className="text-xs text-gray-400 mt-0.5">{item.subtopic}</p>}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />{item.suggestedDuration} dk
            </span>
            {item.estimatedQuestionCount > 0 && (
              <span className="text-[10px] text-gray-400">{item.estimatedQuestionCount} soru</span>
            )}
            {prog?.solvedCount > 0 && (
              <span className="text-[10px] text-brand-500 font-medium">{prog.solvedCount} çözüldü</span>
            )}
            {successRate !== null && (
              <span className={cn('text-[10px] font-medium',
                successRate >= 80 ? 'text-emerald-500' : successRate >= 60 ? 'text-amber-500' : 'text-red-500'
              )}>%{successRate}</span>
            )}
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', showForm && 'rotate-180')} />
      </div>

      {item.teacherNote && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-lg p-2">
            📌 {item.teacherNote}
          </p>
        </div>
      )}

      {prog?.teacherFeedback && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-lg p-2">
            💬 {prog.teacherFeedback}
          </p>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden px-4 pb-4">
            <ProgressForm item={item} token={token} onSave={onUpdate} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── RESOURCE SECTION ─────────────────────────────────────────────────────────
function ResourceSection({ resources, token, onUpdate }: any) {
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  if (!resources || resources.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="font-medium">Bu program için henüz kaynak atanmadı</p>
        <p className="text-sm mt-1">Öğretmeniniz yakında ekleyecek</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map((resource: any) => {
        const plan = resource.aiPlan;
        if (!plan) return null;
        const items = plan.planItems || [];
        const completed = items.filter((i: any) => i.progress?.[0]?.isCompleted).length;
        const progress = items.length ? Math.round((completed / items.length) * 100) : 0;
        const isExpanded = expandedResource === resource.id;

        return (
          <motion.div key={resource.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
            <div className="p-4 cursor-pointer" onClick={() => setExpandedResource(isExpanded ? null : resource.id)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {plan.title || resource.fileName}
                  </p>
                  {plan.summary && <p className="text-xs text-gray-400 truncate">{plan.summary}</p>}
                </div>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', isExpanded && 'rotate-180')} />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{completed}/{items.length} konu tamamlandı</span>
                  <span className="text-xs font-medium text-brand-500">%{progress}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-brand-500 rounded-full h-1.5 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-2 border-t border-black/[0.04]">
                    <p className="text-xs text-gray-400 pt-3">Her konuya tıklayarak ilerlemenizi kaydedin</p>
                    {items.map((item: any) => (
                      <PlanItem key={item.id} item={item} token={token} onUpdate={onUpdate} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── ANA SAYFA ────────────────────────────────────────────────────────────────
export default function StudentPortalPage() {
  const params = useParams();
  const id = params.id as string;

  const [password, setPassword]         = useState('');
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [studentData, setStudentData]   = useState<any>(null);
  const [token, setToken]               = useState('');
  const [loading, setLoading]           = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeContext, setActiveContext] = useState<ContextKey>('BILSEM');
  const [contextResources, setContextResources] = useState<Record<string, any[]>>({});
  const [loadingCtx, setLoadingCtx]     = useState(false);

  useEffect(() => {
    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.studentId === id && parsed.token) {
          fetchData(parsed.token);
          return;
        }
      } catch {}
    }
    setLoading(false);
  }, [id]);

  async function fetchData(tkn: string) {
    try {
      const studentRes = await api.get(`/students/${id}/portal-data`);
      setStudentData(studentRes.data);
      setToken(tkn);
      setIsLoggedIn(true);
      await loadContext(tkn, 'BILSEM');
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }

  async function loadContext(tkn: string, ctx: ContextKey) {
    if (contextResources[ctx]) return;
    setLoadingCtx(true);
    try {
      const res = await api.get(`/portal/resources?context=${ctx}`, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      setContextResources(prev => ({ ...prev, [ctx]: res.data }));
    } catch {
      setContextResources(prev => ({ ...prev, [ctx]: [] }));
    } finally {
      setLoadingCtx(false);
    }
  }

  async function switchContext(ctx: ContextKey) {
    setActiveContext(ctx);
    await loadContext(token, ctx);
  }

  async function refreshContext() {
    setContextResources(prev => {
      const next = { ...prev };
      delete next[activeContext];
      return next;
    });
    await loadContext(token, activeContext);
  }

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await api.post('/auth/student-login', { studentId: id, password });
      const { access_token } = res.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ studentId: id, token: access_token }));
      await fetchData(access_token);
      toast.success('Hoş geldin!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Şifre hatalı');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setIsLoggedIn(false);
    setStudentData(null);
    setPassword('');
    setToken('');
    setContextResources({});
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-violet-50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Yükleniyor...</p>
      </div>
    </div>
  );

  // ── Login ────────────────────────────────────────────────────────────────────
  if (!isLoggedIn) return (
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
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10" placeholder="••••••••" required />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Kayıt olduysanız kendi şifrenizi, yoksa öğretmeninizden aldığınız şifreyi girin.
              </p>
            </div>
            <button type="submit" disabled={loginLoading} className="btn-primary w-full justify-center py-3">
              {loginLoading
                ? <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </span>
                : 'Giriş Yap'
              }
            </button>
          </form>
        </div>
        <div className="text-center mt-4 space-y-1">
          <p className="text-xs text-gray-400">
            Hesabın yok mu?{' '}
            <a href="/kayit" className="text-brand-500 hover:underline">Kayıt ol</a>
          </p>
          <p className="text-xs text-gray-400">Altıeylül BİLSEM • Öğrenci Portalı</p>
        </div>
      </motion.div>
    </div>
  );

  // ── İstatistikler ────────────────────────────────────────────────────────────
  const totalActivities = studentData?.studentLogs?.length || 0;
  const avgPerf = totalActivities > 0
    ? studentData.studentLogs.reduce((s: number, l: any) => s + l.performance, 0) / totalActivities
    : 0;
  const allResources = Object.values(contextResources).flat();
  const totalTopics    = allResources.reduce((s: number, r: any) => s + (r.aiPlan?.planItems?.length || 0), 0);
  const completedTopics= allResources.reduce((s: number, r: any) =>
    s + (r.aiPlan?.planItems?.filter((i: any) => i.progress?.[0]?.isCompleted).length || 0), 0);
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const activeResources = contextResources[activeContext] || [];

  return (
    <div className="min-h-screen bg-[#f5f5f3] dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-black/[0.06] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-violet-500 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white font-display">BİLSEM Portalı</p>
              <p className="text-xs text-gray-400">{studentData.name} {studentData.surname}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost py-1.5 px-3 text-sm text-red-400">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Karşılama */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-violet-400 flex items-center justify-center text-white text-lg font-bold">
              {getInitials(studentData.name, studentData.surname)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white">
                Merhaba, {studentData.name}! 👋
              </h2>
              <p className="text-sm text-gray-500">
                {studentData.school} • {studentData.grade}. Sınıf • {studentData.mathLevel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-black/[0.04] dark:border-white/[0.04]">
            <div className="text-center">
              <p className="text-xl font-bold font-display text-brand-500">{totalActivities}</p>
              <p className="text-xs text-gray-400">Etkinlik</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-display text-emerald-500">{avgPerf.toFixed(1)}/5</p>
              <p className="text-xs text-gray-400">Performans</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-display text-amber-500">{completedTopics}/{totalTopics}</p>
              <p className="text-xs text-gray-400">Konu</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-display text-violet-500">%{overallProgress}</p>
              <p className="text-xs text-gray-400">İlerleme</p>
            </div>
          </div>

          {totalTopics > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-brand-500 to-violet-500 rounded-full h-2 transition-all"
                  style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Context Sekmeleri ─────────────────────────────────────────────── */}
        <div>
          {/* Tab butonları */}
          <div className="flex gap-2 mb-4">
            {CONTEXTS.map(ctx => {
              const isActive = activeContext === ctx.key;
              const count = (contextResources[ctx.key] || []).length;
              return (
                <button key={ctx.key} onClick={() => switchContext(ctx.key)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium',
                    isActive
                      ? 'bg-brand-500 text-white border-transparent shadow-sm'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-200'
                  )}
                >
                  <span className="text-base">{ctx.icon}</span>
                  <span>{ctx.label}</span>
                  {contextResources[ctx.key] !== undefined && count > 0 && (
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full',
                      isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      {count} kaynak
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Context içeriği */}
          <AnimatePresence mode="wait">
            <motion.div key={activeContext} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{CONTEXTS.find(c => c.key === activeContext)?.icon}</span>
                  Çalışma Planlarım
                </h3>
                {loadingCtx && (
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <ResourceSection
                resources={activeResources}
                token={token}
                onUpdate={refreshContext}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Son Etkinlikler */}
        {(studentData.studentLogs || []).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Etkinliklerim</h3>
            </div>
            <div className="space-y-2">
              {studentData.studentLogs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-8 h-8 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {log.activityLog?.activity?.title || log.activityLog?.topic}
                    </p>
                    <p className="text-xs text-gray-400">{formatRelativeDate(log.activityLog?.date)}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={cn('w-3 h-3',
                        i < log.performance ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                      )} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Geri Bildirimler */}
        {(studentData.feedbacks || []).filter((f: any) => f.status === 'GONDERILDI').length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Öğretmen Geri Bildirimleri</h3>
            </div>
            {studentData.feedbacks
              .filter((f: any) => f.status === 'GONDERILDI')
              .map((fb: any) => (
                <div key={fb.id} className="p-4 bg-gradient-to-r from-brand-50 to-violet-50 dark:from-brand-900/20 dark:to-violet-900/20 rounded-xl mb-3">
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2">{fb.period}</p>
                  <p className="text-[10px] font-semibold uppercase text-emerald-600 mb-1">Güçlü Yönlerin</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{fb.strengths}</p>
                  <p className="text-[10px] font-semibold uppercase text-amber-600 mb-1">Gelişim Alanların</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{fb.improvements}</p>
                  {fb.motivation && (
                    <p className="text-xs text-brand-700 dark:text-brand-300 italic mt-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                      💬 {fb.motivation}
                    </p>
                  )}
                </div>
              ))
            }
          </motion.div>
        )}

      </main>
    </div>
  );
}
