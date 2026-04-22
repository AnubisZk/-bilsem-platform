'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { reportsApi, studentsApi } from '@/lib/api';
import { TrendingUp, Users, BookOpen, Target, Award } from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const MOCK_TOPIC_DATA = [
  { topic: 'Sayı Örüntüleri', başarı: 82, katılım: 95 },
  { topic: 'Kesirler', başarı: 74, katılım: 88 },
  { topic: 'Geometri', başarı: 91, katılım: 92 },
  { topic: 'Olasılık', başarı: 65, katılım: 78 },
  { topic: 'Denklemler', başarı: 79, katılım: 85 },
  { topic: 'İstatistik', başarı: 88, katılım: 90 },
];

const MOCK_RADAR_DATA = [
  { subject: 'Analitik Düşünme', A: 80 },
  { subject: 'Problem Çözme', A: 72 },
  { subject: 'Uzamsal Düşünme', A: 88 },
  { subject: 'Sayısal Akıl Yürütme', A: 85 },
  { subject: 'Mantıksal Düşünme', A: 78 },
  { subject: 'Yaratıcı Düşünme', A: 68 },
];

const MOCK_LEVEL_DATA = [
  { name: 'Üstün', value: 6, color: '#6366f1' },
  { name: 'İleri', value: 8, color: '#10b981' },
  { name: 'Gelişen', value: 4, color: '#f59e0b' },
  { name: 'Başlangıç', value: 2, color: '#9ca3af' },
];

export default function AnalyticsPage() {
  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.dashboard().then((r) => r.data),
  });

  const { data: studentStats } = useQuery({
    queryKey: ['student-stats'],
    queryFn: () => studentsApi.stats().then((r) => r.data),
  });

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="page-title">Analitik Merkezi</h2>
        <p className="text-sm text-gray-400 mt-0.5">Öğrenci gelişimi ve etkinlik performans analizleri</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ort. Katılım', value: '87%', icon: Users, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Ort. Başarı', value: '79%', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Tamamlanan Etkinlik', value: dash?.weeklyActivityCount ?? 0, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'En İyi Sınıf', value: '7. Sınıf', icon: Award, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="stat-card"
          >
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold font-display text-gray-900 dark:text-white mt-2">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Topic performance bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Konu Bazlı Başarı</h3>
          <p className="text-xs text-gray-400 mb-5">Ortalama başarı ve katılım oranları</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MOCK_TOPIC_DATA} layout="vertical" barSize={8}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="topic" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '10px', fontSize: 12 }}
                formatter={(v: any) => [`%${v}`, '']}
              />
              <Bar dataKey="başarı" fill="#6366f1" radius={[0, 4, 4, 0]} name="Başarı" />
              <Bar dataKey="katılım" fill="#10b981" radius={[0, 4, 4, 0]} name="Katılım" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Level distribution pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Seviye Dağılımı</h3>
          <p className="text-xs text-gray-400 mb-5">Öğrenci matematik seviyeleri</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={MOCK_LEVEL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {MOCK_LEVEL_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} öğrenci`, '']} contentStyle={{ fontSize: 12, borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {MOCK_LEVEL_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{d.name}</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skill radar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Beceri Haritası</h3>
          <p className="text-xs text-gray-400 mb-3">Grup ortalama beceri profili</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={MOCK_RADAR_DATA}>
              <PolarGrid stroke="rgba(0,0,0,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Radar name="Grup" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip formatter={(v: any) => [`%${v}`, '']} contentStyle={{ fontSize: 12, borderRadius: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Progress area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Aylık İlerleme</h3>
          <p className="text-xs text-gray-400 mb-5">Performans gelişim trendi</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[
              { month: 'Eyl', score: 68 },
              { month: 'Eki', score: 72 },
              { month: 'Kas', score: 75 },
              { month: 'Ara', score: 74 },
              { month: 'Oca', score: 78 },
              { month: 'Şub', score: 82 },
              { month: 'Mar', score: 85 },
              { month: 'Nis', score: 88 },
            ]}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '10px', fontSize: 12 }}
                formatter={(v: any) => [`%${v}`, 'Başarı']}
              />
              <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
