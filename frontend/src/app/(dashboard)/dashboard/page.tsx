'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, UsersRound, BookOpen, MessageSquare,
  TrendingUp, Clock, Sparkles, ChevronRight, Activity,
} from 'lucide-react';
import { reportsApi, activitiesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/api';
import { formatRelativeDate, getDifficultyColor, getDifficultyLabel } from '@/lib/utils';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

const STAGGER_DELAY = 0.08;

function StatCard({ icon: Icon, label, value, sub, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="stat-card group cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold font-display text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

const MOCK_ACTIVITY_DATA = [
  { week: 'H1', etkinlik: 4, ogrenci: 12 },
  { week: 'H2', etkinlik: 7, ogrenci: 15 },
  { week: 'H3', etkinlik: 5, ogrenci: 11 },
  { week: 'H4', etkinlik: 9, ogrenci: 18 },
  { week: 'H5', etkinlik: 6, ogrenci: 14 },
  { week: 'H6', etkinlik: 11, ogrenci: 20 },
  { week: 'H7', etkinlik: 8, ogrenci: 16 },
  { week: 'H8', etkinlik: 13, ogrenci: 22 },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: dashData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.dashboard().then((r) => r.data),
  });

  const { data: topActivities } = useQuery({
    queryKey: ['top-activities'],
    queryFn: () => activitiesApi.top().then((r) => r.data),
  });

  const stats = [
    {
      icon: Users,
      label: 'Toplam Öğrenci',
      value: dashData?.studentCount ?? '—',
      sub: 'Aktif kayıtlı',
      color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
    },
    {
      icon: UsersRound,
      label: 'Aktif Grup',
      value: dashData?.groupCount ?? '—',
      sub: 'Bu dönem',
      color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    },
    {
      icon: BookOpen,
      label: 'Bu Hafta Etkinlik',
      value: dashData?.weeklyActivityCount ?? '—',
      sub: 'Son 7 gün',
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: MessageSquare,
      label: 'Bekleyen Geri Bildirim',
      value: dashData?.pendingFeedbacks ?? '—',
      sub: 'Taslak durumunda',
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="page-title">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Bugün {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/activities">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4" />
            Etkinlik Başlat
          </motion.button>
        </Link>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * STAGGER_DELAY} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Etkinlik Trendi</h3>
              <p className="text-xs text-gray-400 mt-0.5">Son 8 haftalık aktivite</p>
            </div>
            <span className="badge-green text-xs">↑ Gelişiyor</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_ACTIVITY_DATA}>
              <defs>
                <linearGradient id="etkinlikGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  fontSize: 12,
                }}
                labelFormatter={(l) => `${l}. Hafta`}
              />
              <Area
                type="monotone" dataKey="etkinlik" stroke="#6366f1"
                strokeWidth={2} fill="url(#etkinlikGrad)"
                name="Etkinlik"
              />
              <Area
                type="monotone" dataKey="ogrenci" stroke="#10b981"
                strokeWidth={2} fill="none" strokeDasharray="4 2"
                name="Öğrenci Katılımı"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top activities */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Popüler Etkinlikler</h3>
            <Link href="/activities" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
              Tümü <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(topActivities || []).slice(0, 5).map((a: any, i: number) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs flex items-center justify-center font-medium flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{a.title}</p>
                  <p className="text-[10px] text-gray-400">{a.topic}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{a.usageCount}×</span>
              </div>
            ))}
            {(!topActivities || topActivities.length === 0) && (
              <p className="text-xs text-gray-400 text-center py-4">
                Henüz etkinlik kullanılmadı
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent activity logs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Son Ders Kayıtları</h3>
          </div>
          <Link href="/activities" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
            Tümünü gör <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {(dashData?.recentLogs || []).slice(0, 6).map((log: any) => (
            <div
              key={log.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="w-8 h-8 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {log.activity?.title || log.topic}
                </p>
                <p className="text-xs text-gray-400">
                  {log.group?.name} • {log.duration} dk
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < log.participation ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatRelativeDate(log.date)}
                </p>
              </div>
            </div>
          ))}

          {(!dashData?.recentLogs || dashData.recentLogs.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz ders kaydı yok</p>
              <p className="text-xs mt-1">Etkinlik kütüphanesinden bir etkinlik başlatın</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
