'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText, Download, User, Users, Calendar, ChevronRight,
  BookOpen, Star, TrendingUp, Brain, Sparkles,
} from 'lucide-react';
import { reportsApi, studentsApi, groupsApi } from '@/lib/api';
import { cn, formatDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [tab, setTab] = useState<'student' | 'group'>('student');
  const [selectedId, setSelectedId] = useState('');
  const [period, setPeriod] = useState('2024-2025 Güz');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.list().then((r) => r.data),
  });

  async function generateReport() {
    if (!selectedId) return toast.error('Seçim yapın');
    setLoading(true);
    setReport(null);
    try {
      const res = tab === 'student'
        ? await reportsApi.student(selectedId, period)
        : await reportsApi.group(selectedId, period);
      setReport(res.data);
      toast.success('Rapor oluşturuldu!');
    } catch {
      toast.error('Rapor oluşturulamadı');
    } finally {
      setLoading(false);
    }
  }

  function downloadReportText() {
    if (!report) return;
    const content = tab === 'student'
      ? `BİLSEM MATEMATİK GELİŞİM RAPORU\n\nÖğrenci: ${report.student?.name}\nDönem: ${report.period}\n\n${report.aiReport}`
      : `BİLSEM GRUP RAPORU\n\nGrup: ${report.group?.name}\nDönem: ${report.period}\n\nÖğrenci Sayısı: ${report.studentCount}\nToplam Etkinlik: ${report.totalActivities}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilsem-rapor-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Rapor indirildi!');
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="page-title">Raporlar</h2>
        <p className="text-sm text-gray-400 mt-0.5">AI destekli öğrenci ve grup gelişim raporları</p>
      </div>

      {/* Config card */}
      <div className="card p-5">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl w-fit">
          {[
            { key: 'student', label: 'Öğrenci Raporu', icon: User },
            { key: 'group',   label: 'Grup Raporu',    icon: Users },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setSelectedId(''); setReport(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t.key
                  ? 'bg-white dark:bg-[#2e2e2c] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="label">{tab === 'student' ? 'Öğrenci' : 'Grup'} Seçin</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="input-field">
              <option value="">Seçin...</option>
              {(tab === 'student' ? students : groups).map((item: any) => (
                <option key={item.id} value={item.id}>
                  {tab === 'student' ? `${item.name} ${item.surname}` : item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Dönem</label>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} className="input-field" placeholder="2024-2025 Güz" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateReport}
            disabled={loading || !selectedId}
            className="btn-primary"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI rapor oluşturuyor...
              </span>
            ) : (
              <><Sparkles className="w-4 h-4" /> Rapor Oluştur</>
            )}
          </motion.button>

          {report && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadReportText}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" /> İndir
            </motion.button>
          )}
        </div>
      </div>

      {/* Report output */}
      {loading && (
        <div className="card p-8 text-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium text-gray-700 dark:text-gray-300">Claude AI rapor hazırlıyor...</p>
          <p className="text-sm text-gray-400 mt-1">Bu birkaç saniye sürebilir</p>
        </div>
      )}

      {report && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {tab === 'student' ? (
            <>
              {/* Student header */}
              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-violet-400 flex items-center justify-center text-white text-lg font-bold">
                    {getInitials(report.student?.name || '')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
                      {report.student?.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{report.student?.school} • {report.student?.grade}. Sınıf</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="badge badge-brand">{report.period}</span>
                      <span className="badge badge-purple">{report.student?.mathLevel}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div className="text-center">
                    <p className="text-xl font-bold font-display text-brand-500">{report.stats?.activityCount}</p>
                    <p className="text-xs text-gray-400">Etkinlik</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold font-display text-emerald-500">{report.stats?.avgPerformance}/5</p>
                    <p className="text-xs text-gray-400">Ort. Performans</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold font-display text-amber-500">
                      {report.stats?.examAvg ? `%${Math.round(report.stats.examAvg)}` : '—'}
                    </p>
                    <p className="text-xs text-gray-400">Sınav Ort.</p>
                  </div>
                </div>
              </div>

              {/* AI Report */}
              {report.aiReport && (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-4 h-4 text-violet-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">AI Gelişim Raporu</h4>
                    <span className="badge badge-purple text-[10px] ml-auto">Claude AI</span>
                  </div>
                  <div className="prose-bilsem whitespace-pre-wrap leading-relaxed">
                    {report.aiReport}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {report.feedback && (
                <div className="card p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Öğretmen Geri Bildirimi</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Güçlü Yönler', value: report.feedback.strengths, color: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Gelişim Alanları', value: report.feedback.improvements, color: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Hedefler', value: report.feedback.nextGoals, color: 'text-brand-600 dark:text-brand-400' },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${item.color}`}>{item.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Group report */
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg font-display mb-2">{report.group?.name}</h3>
              <p className="text-sm text-gray-400 mb-5">{report.period} • {report.studentCount} öğrenci</p>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="card p-4 bg-brand-50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-900/30">
                  <p className="text-2xl font-bold font-display text-brand-600">{report.studentCount}</p>
                  <p className="text-xs text-brand-500 mt-1">Toplam Öğrenci</p>
                </div>
                <div className="card p-4 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-2xl font-bold font-display text-emerald-600">{report.totalActivities}</p>
                  <p className="text-xs text-emerald-500 mt-1">Toplam Etkinlik</p>
                </div>
              </div>

              {/* Student summaries */}
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Öğrenci Özetleri</h4>
              <div className="space-y-2">
                {report.studentSummaries?.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.activityCount} etkinlik</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.avgPerformance}/5</p>
                      <p className="text-xs text-gray-400">ort. perf.</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top topics */}
              {report.topTopics?.length > 0 && (
                <div className="mt-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">En Çok İşlenen Konular</h4>
                  <div className="space-y-2">
                    {report.topTopics.slice(0, 5).map((t: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4">{i+1}.</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-brand-500 h-2 rounded-full"
                            style={{ width: `${(t.count / (report.topTopics[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-32 truncate">{t.topic}</span>
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 w-8 text-right">{t.count}×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
