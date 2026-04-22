'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, School, Users, BookOpen, MessageSquare,
  TrendingUp, Star, Target, Clock, Trash2,
  Award, Activity, FileText, Brain, Key, ExternalLink,
} from 'lucide-react';
import { studentsApi, feedbackApi, api } from '@/lib/api';
import {
  cn, getInitials, getMathLevelColor, getLevelLabel,
  formatRelativeDate,
} from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';

const AVATAR_COLORS = [
  'from-brand-400 to-violet-400',
  'from-emerald-400 to-teal-400',
  'from-amber-400 to-orange-400',
  'from-pink-400 to-rose-400',
  'from-sky-400 to-blue-400',
];

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [portalInfo, setPortalInfo] = useState<any>(null);
  const [creatingPortal, setCreatingPortal] = useState(false);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.get(id as string).then((r) => r.data),
  });

  const { data: analytics } = useQuery({
    queryKey: ['student-analytics', id],
    queryFn: () => studentsApi.analytics(id as string).then((r) => r.data),
    enabled: !!id,
  });

  const { data: observations = [] } = useQuery({
    queryKey: ['observations', id],
    queryFn: () => feedbackApi.getObservations(id as string).then((r) => r.data),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => studentsApi.delete(id as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success('Öğrenci silindi');
      router.push('/students');
    },
  });

  async function createPortal() {
    setCreatingPortal(true);
    try {
      const res = await api.post(`/students/${id}/create-portal`);
      setPortalInfo(res.data);
      toast.success(res.data.exists ? 'Mevcut portal bilgileri' : 'Portal hesabı oluşturuldu!');
    } catch {
      toast.error('Portal oluşturulamadı');
    } finally {
      setCreatingPortal(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-5xl">
        <div className="shimmer-bg h-8 w-48 rounded-xl" />
        <div className="card p-6 space-y-4">
          <div className="shimmer-bg h-16 w-16 rounded-xl" />
          <div className="shimmer-bg h-6 w-48 rounded" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  const colorIndex = student.name.charCodeAt(0) % AVATAR_COLORS.length;

  const radarData = [
    { subject: 'Analitik', A: 75 },
    { subject: 'Problem Çözme', A: 68 },
    { subject: 'Uzamsal', A: 82 },
    { subject: 'Sayısal', A: 79 },
    { subject: 'Mantıksal', A: 71 },
    { subject: 'Yaratıcı', A: 65 },
  ];

  const progressData = [
    { ay: 'Eyl', puan: 68 }, { ay: 'Eki', puan: 72 },
    { ay: 'Kas', puan: 75 }, { ay: 'Ara', puan: 74 },
    { ay: 'Oca', puan: 79 }, { ay: 'Şub', puan: 83 },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      <Link href="/students">
        <button className="btn-ghost py-2 -ml-1">
          <ArrowLeft className="w-4 h-4" /> Öğrenciler
        </button>
      </Link>

      {/* Üst kart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[colorIndex]} flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0`}>
              {getInitials(student.name, student.surname)}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">
                {student.name} {student.surname}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <School className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{student.school}</p>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="badge badge-brand">{getLevelLabel(student.level)}</span>
                <span className={`badge ${getMathLevelColor(student.mathLevel)}`}>{student.mathLevel}</span>
                <span className="badge badge-gray">{student.grade}. Sınıf</span>
                <span className="badge badge-gray">{student.bilsemLevel}</span>
              </div>
            </div>
          </div>

          {/* Aksiyonlar */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={createPortal}
              disabled={creatingPortal}
              className="btn-secondary text-sm py-2"
            >
              <Key className="w-4 h-4" />
              {creatingPortal ? 'Oluşturuluyor...' : 'Portal Hesabı'}
            </button>
            <a href={`/portal/${id}`} target="_blank" rel="noopener noreferrer">
              <button className="btn-primary text-sm py-2">
                <ExternalLink className="w-4 h-4" /> Portala Git
              </button>
            </a>
            <button
              onClick={() => {
                if (confirm(`${student.name} ${student.surname} silinsin mi?`)) deleteMutation.mutate();
              }}
              className="btn-ghost p-2 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portal bilgileri */}
        {portalInfo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl"
          >
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              {portalInfo.exists ? '🔑 Mevcut Portal Bilgileri' : '✅ Portal Hesabı Oluşturuldu!'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <div><span className="font-medium">E-posta:</span> {portalInfo.email}</div>
              <div><span className="font-medium">Şifre:</span> {portalInfo.password}</div>
            </div>
            <p className="text-xs text-emerald-500 mt-2">Bu bilgileri öğrenciye iletin. Öğrenci şifresini daha sonra değiştirebilir.</p>
          </motion.div>
        )}

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-black/[0.04] dark:border-white/[0.04]">
          <div className="text-center">
            <p className="text-2xl font-bold font-display text-brand-500">{analytics?.totalActivities ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-1">Toplam Etkinlik</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-display text-emerald-500">{analytics?.avgPerformance ?? '—'}/5</p>
            <p className="text-xs text-gray-400 mt-1">Ort. Performans</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-display text-amber-500">{student.feedbacks?.length ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">Geri Bildirim</p>
          </div>
        </div>
      </motion.div>

      {/* İki sütun */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sol */}
        <div className="space-y-4">
          {student.strengths?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-400" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Güçlü Yönler</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {student.strengths.map((s: string) => <span key={s} className="badge badge-green text-xs">{s}</span>)}
              </div>
            </motion.div>
          )}

          {student.weaknesses?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-red-400" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Gelişim Alanları</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {student.weaknesses.map((w: string) => <span key={w} className="badge badge-red text-xs">{w}</span>)}
              </div>
            </motion.div>
          )}

          {student.groupStudents?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-brand-400" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Gruplar</h4>
              </div>
              <div className="space-y-2">
                {student.groupStudents.map((gs: any) => (
                  <div key={gs.group?.id} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: gs.group?.color || '#6366f1' }} />
                    <span className="text-gray-700 dark:text-gray-300">{gs.group?.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {student.notes && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Notlar</h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{student.notes}</p>
            </motion.div>
          )}
        </div>

        {/* Sağ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3">Beceri Profili</h4>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(0,0,0,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-4">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3">Gelişim Trendi</h4>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="ay" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: '10px' }} />
                  <Area type="monotone" dataKey="puan" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Son Etkinlikler</h4>
            </div>
            <div className="space-y-2">
              {(student.studentLogs || []).slice(0, 6).map((log: any) => (
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
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i < log.performance ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700')} />
                    ))}
                  </div>
                </div>
              ))}
              {(student.studentLogs || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Henüz etkinlik kaydı yok</p>
              )}
            </div>
          </motion.div>

          {(student.feedbacks || []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Son Geri Bildirim</h4>
              </div>
              {student.feedbacks.slice(0, 2).map((fb: any) => (
                <div key={fb.id} className="p-4 bg-gradient-to-r from-brand-50 to-violet-50 dark:from-brand-900/20 dark:to-violet-900/20 rounded-xl mb-3">
                  <p className="text-xs font-medium text-brand-700 dark:text-brand-300 mb-1">{fb.period}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">{fb.strengths}</p>
                </div>
              ))}
            </motion.div>
          )}

          {observations.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-gray-400" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Gözlemler</h4>
              </div>
              <div className="space-y-2">
                {observations.slice(0, 3).map((obs: any) => (
                  <div key={obs.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{obs.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelativeDate(obs.date)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
