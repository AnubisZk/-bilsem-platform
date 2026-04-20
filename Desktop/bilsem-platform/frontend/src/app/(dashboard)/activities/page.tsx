'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, BookOpen, Clock, Target, Play, X,
  ChevronRight, Layers, Star, CheckCircle, Users, Brain,
} from 'lucide-react';
import { activitiesApi, groupsApi } from '@/lib/api';
import { cn, getDifficultyColor, getDifficultyLabel, getLevelLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const SKILL_COLORS = [
  'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
  'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
  'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300',
];

function ActivityCard({ activity, onApply }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 group hover:shadow-card-hover transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">
            {activity.title}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">{activity.module?.name}</p>
        </div>
        <span className={`badge text-[10px] flex-shrink-0 ${getDifficultyColor(activity.difficulty)}`}>
          {getDifficultyLabel(activity.difficulty)}
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
        {activity.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />{activity.duration} dk
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />{activity.topic}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />{activity.gradeRange}. sınıf
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Play className="w-3 h-3" />{activity.usageCount}× kullanıldı
        </span>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(activity.skills || []).slice(0, 3).map((skill: string, i: number) => (
          <span key={skill} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>
            {skill}
          </span>
        ))}
      </div>

      {/* Objectives (expandable) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Kazanımlar</p>
              {(activity.objectives || []).map((obj: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">{obj}</p>
                </div>
              ))}
              {activity.teacherNotes && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Öğretmen Notu</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">{activity.teacherNotes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn-ghost py-1.5 px-3 text-xs flex-1 justify-center"
        >
          {expanded ? 'Gizle' : 'Detaylar'}
          <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
        </button>
        <button
          onClick={() => onApply(activity)}
          className="btn-primary py-1.5 px-4 text-xs"
        >
          <Play className="w-3 h-3" /> Uygula
        </button>
      </div>
    </motion.div>
  );
}

function LogActivityModal({ activity, groups, onClose, onSave }: any) {
  const { register, handleSubmit, watch } = useForm<any>({
    defaultValues: {
      activityId: activity.id,
      date: new Date().toISOString().split('T')[0],
      participation: 4,
      completion: 90,
      duration: activity.duration,
      topic: activity.topic,
      homeworkGiven: false,
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card w-full max-w-md shadow-modal p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">Ders Kaydı</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl mb-4">
          <p className="text-xs font-medium text-brand-700 dark:text-brand-300">{activity.title}</p>
          <p className="text-xs text-brand-500 dark:text-brand-400">{activity.topic} • {activity.duration} dk</p>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Grup</label>
              <select {...register('groupId')} className="input-field">
                <option value="">Grup seçin</option>
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tarih</label>
              <input {...register('date')} type="date" className="input-field" />
            </div>
          </div>

          <div>
            <label className="label">Katılım Düzeyi: {watch('participation')}/5</label>
            <input {...register('participation', { valueAsNumber: true })} type="range" min="1" max="5" className="w-full accent-brand-500" />
          </div>

          <div>
            <label className="label">Tamamlanma: %{watch('completion')}</label>
            <input {...register('completion', { valueAsNumber: true })} type="range" min="0" max="100" step="5" className="w-full accent-brand-500" />
          </div>

          <div>
            <label className="label">Süre (dk)</label>
            <input {...register('duration', { valueAsNumber: true })} type="number" className="input-field" />
          </div>

          <div>
            <label className="label">Notlar</label>
            <textarea {...register('notes')} className="input-field resize-none" rows={2} placeholder="Ders notu..." />
          </div>

          <div className="flex items-center gap-3">
            <input {...register('homeworkGiven')} type="checkbox" id="hw" className="accent-brand-500 w-4 h-4" />
            <label htmlFor="hw" className="text-sm text-gray-700 dark:text-gray-300">Ödev verildi</label>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              <CheckCircle className="w-4 h-4" /> Kaydet
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ActivitiesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'modules'>('grid');

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', { search, level, difficulty }],
    queryFn: () => activitiesApi.list({ search, level: level || undefined, difficulty: difficulty || undefined }).then((r) => r.data),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['modules', level],
    queryFn: () => activitiesApi.modules(level || undefined).then((r) => r.data),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.list().then((r) => r.data),
  });

  const logMutation = useMutation({
    mutationFn: (data: any) => activitiesApi.log(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
      setSelectedActivity(null);
      toast.success('Ders başarıyla kaydedildi!');
    },
    onError: () => toast.error('Kayıt başarısız'),
  });

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Etkinlik Kütüphanesi</h2>
          <p className="text-sm text-gray-400 mt-0.5">{activities.length} etkinlik mevcut</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'modules' : 'grid')}
            className="btn-secondary"
          >
            <Layers className="w-4 h-4" />
            {viewMode === 'grid' ? 'Modül Görünümü' : 'Tüm Etkinlikler'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Etkinlik, konu veya kazanım ara..."
            className="input-field pl-9 py-2"
          />
        </div>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field py-2 w-auto">
          <option value="">Tüm Kademeler</option>
          <option value="ILKOGRETIM">İlköğretim</option>
          <option value="LISE">Lise</option>
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field py-2 w-auto">
          <option value="">Tüm Zorluklar</option>
          <option value="KOLAY">Kolay</option>
          <option value="ORTA">Orta</option>
          <option value="ZOR">Zor</option>
          <option value="OLIMPIYAT">Olimpiyat</option>
        </select>
        {(search || level || difficulty) && (
          <button onClick={() => { setSearch(''); setLevel(''); setDifficulty(''); }} className="btn-ghost py-2 text-red-500">
            <X className="w-4 h-4" /> Temizle
          </button>
        )}
      </div>

      {/* Module view */}
      {viewMode === 'modules' ? (
        <div className="space-y-6">
          {modules.map((mod: any) => (
            <div key={mod.id} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{mod.name}</h3>
                  <p className="text-xs text-gray-400">{getLevelLabel(mod.level)} • {mod._count?.activities || 0} etkinlik</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(mod.activities || []).slice(0, 6).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer group">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getDifficultyColor(a.difficulty).includes('green') ? 'bg-emerald-400' : getDifficultyColor(a.difficulty).includes('amber') ? 'bg-amber-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{a.title}</p>
                      <p className="text-[10px] text-gray-400">{a.topic}</p>
                    </div>
                    <button
                      onClick={() => setSelectedActivity(a)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity btn-primary py-1 px-2 text-[10px]"
                    >
                      Uygula
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {activities.map((activity: any) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onApply={(a: any) => setSelectedActivity(a)}
              />
            ))}
          </AnimatePresence>

          {activities.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Etkinlik bulunamadı</p>
              <p className="text-sm mt-1">Farklı filtreler deneyin</p>
            </div>
          )}
        </div>
      )}

      {/* Log Activity Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <LogActivityModal
            activity={selectedActivity}
            groups={groups}
            onClose={() => setSelectedActivity(null)}
            onSave={(data: any) => logMutation.mutate(data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
