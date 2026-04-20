'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Sparkles, Filter, Star, StarOff, Trash2,
  Edit, X, BookOpen, Sigma, Brain, ChevronDown, Copy, Eye,
  Wand2, Globe, Lock, CheckCircle2,
} from 'lucide-react';
import { questionsApi, aiApi } from '@/lib/api';
import { cn, getDifficultyColor, getDifficultyLabel, DIFFICULTY_OPTIONS, QUESTION_TYPES } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const TYPE_ICONS: Record<string, string> = {
  COGUL_SECMELI: '⓪',
  ACIK_UCLU:     '✏️',
  DOGRU_YANLIS:  '✓',
  ESLESTIRME:    '↔',
  ZEKA:          '🧩',
  PROBLEM_COZME: '🔧',
  OLIMPIYAT:     '🏆',
  ETKINLIK:      '🎯',
  MINI_QUIZ:     '⚡',
};

function QuestionCard({ q, onDelete, onFavorite }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="card p-4 hover:shadow-card-hover transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center flex-shrink-0 text-base">
          {TYPE_ICONS[q.type] || '📝'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug truncate">
              {q.title}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              {q.isPublic
                ? <Globe className="w-3 h-3 text-gray-300" />
                : <Lock className="w-3 h-3 text-gray-300" />
              }
              {q.aiGenerated && (
                <Sparkles className="w-3 h-3 text-violet-400" />
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`badge text-[10px] ${getDifficultyColor(q.difficulty)}`}>
              {getDifficultyLabel(q.difficulty)}
            </span>
            <span className="badge badge-gray text-[10px]">{q.topic}</span>
            <span className="badge badge-gray text-[10px]">{q.gradeLevel}</span>
            {q.tags?.slice(0, 2).map((tag: string) => (
              <span key={tag} className="badge badge-brand text-[10px]">{tag}</span>
            ))}
          </div>

          {/* Preview */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
            {q.body}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-ghost py-1 px-2 text-xs"
            >
              <Eye className="w-3 h-3" />
              {expanded ? 'Gizle' : 'Görüntüle'}
            </button>
            <button
              onClick={() => onFavorite(q.id)}
              className={cn('btn-ghost py-1 px-2 text-xs', q.isFavorite && 'text-amber-500')}
            >
              {q.isFavorite ? <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> : <Star className="w-3 h-3" />}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(q.body).then(() => toast.success('Kopyalandı!'))}
              className="btn-ghost py-1 px-2 text-xs"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(q.id)}
              className="btn-ghost py-1 px-2 text-xs text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Expanded view */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Soru</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{q.body}</p>
                  </div>
                  {q.options && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(q.options as Record<string, string>).map(([k, v]) => (
                        <div
                          key={k}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs flex items-center gap-2',
                            k === q.correctAnswer
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400',
                          )}
                        >
                          <span className="font-bold">{k})</span>
                          {v}
                          {k === q.correctAnswer && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.solution && (
                    <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-brand-700 dark:text-brand-300 mb-1">Çözüm</p>
                      <p className="text-xs text-brand-600 dark:text-brand-400 leading-relaxed">{q.solution}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function AIGeneratorModal({ onClose, onGenerated }: any) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [params, setParams] = useState({
    topic: '', gradeLevel: '6-7', difficulty: 'ORTA', type: 'ACIK_UCLU', count: 5,
  });

  async function generate() {
    if (!params.topic) return toast.error('Konu giriniz');
    setGenerating(true);
    try {
      const res = await aiApi.generateQuestions({
        ...params,
        count: Number(params.count),
        additionalContext: prompt,
      });
      setGeneratedQuestions(res.data);
      toast.success(`${res.data.length} soru üretildi!`);
    } catch {
      toast.error('AI soru üretemedi');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card w-full max-w-2xl shadow-modal max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-brand-500 rounded-lg flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="section-title">AI Soru Üretici</h3>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="label">Konu *</label>
              <input
                value={params.topic}
                onChange={(e) => setParams({ ...params, topic: e.target.value })}
                className="input-field"
                placeholder="Oran orantı, örüntüler, türev..."
              />
            </div>
            <div>
              <label className="label">Sınıf Aralığı</label>
              <select
                value={params.gradeLevel}
                onChange={(e) => setParams({ ...params, gradeLevel: e.target.value })}
                className="input-field"
              >
                {['4-5','5-6','6-7','7-8','9-10','10-11','11-12'].map((g) => (
                  <option key={g} value={g}>{g}. Sınıf</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Zorluk</label>
              <select
                value={params.difficulty}
                onChange={(e) => setParams({ ...params, difficulty: e.target.value })}
                className="input-field"
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{getDifficultyLabel(d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Soru Tipi</label>
              <select
                value={params.type}
                onChange={(e) => setParams({ ...params, type: e.target.value })}
                className="input-field"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Soru Sayısı</label>
              <select
                value={params.count}
                onChange={(e) => setParams({ ...params, count: Number(e.target.value) })}
                className="input-field"
              >
                {[3,5,8,10,15,20].map((n) => <option key={n} value={n}>{n} soru</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Ek Bağlam (İsteğe Bağlı)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder='Örn: "Gerçek hayat senaryoları içersin, olimpiyat tarzi olsun"'
            />
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="btn-primary w-full justify-center py-3"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sorular üretiliyor...
              </span>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                {params.count} Soru Üret
              </>
            )}
          </button>

          {/* Generated questions preview */}
          {generatedQuestions.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Üretilen Sorular ({generatedQuestions.length})
                </p>
                <button
                  onClick={() => onGenerated(generatedQuestions)}
                  className="btn-primary py-1.5 px-3 text-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tümünü Kaydet
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {generatedQuestions.map((q: any, i: number) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{i+1}. {q.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{q.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function QuestionsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ difficulty: '', type: '', isFavorite: false });
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', filters],
    queryFn: () => questionsApi.list({ ...filters, search }).then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['question-stats'],
    queryFn: () => questionsApi.stats().then((r) => r.data),
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['question-topics'],
    queryFn: () => questionsApi.topics().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['questions'] }); toast.success('Soru silindi'); },
  });

  const favMutation = useMutation({
    mutationFn: (id: string) => questionsApi.toggleFavorite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (questions: any[]) => questionsApi.createBulk(questions),
    onSuccess: (_, questions) => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['question-stats'] });
      toast.success(`${questions.length} soru kaydedildi!`);
      setShowAI(false);
    },
  });

  const { register, handleSubmit, reset } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => questionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['question-stats'] });
      setShowAdd(false);
      reset();
      toast.success('Soru eklendi!');
    },
  });

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Soru Bankası</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {stats?.total || 0} soru • {stats?.myQuestions || 0} kişisel • {stats?.publicQuestions || 0} ortak havuz
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAI(true)}
            className="btn-secondary"
          >
            <Wand2 className="w-4 h-4 text-violet-500" />
            AI Üret
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdd(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Soru Ekle
          </motion.button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(stats.byDifficulty || []).map((d: any) => (
            <div key={d.difficulty} className="card p-4">
              <span className={`badge text-xs ${getDifficultyColor(d.difficulty)}`}>
                {getDifficultyLabel(d.difficulty)}
              </span>
              <p className="text-2xl font-bold font-display text-gray-900 dark:text-white mt-2">
                {d._count}
              </p>
              <p className="text-xs text-gray-400">soru</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Soru veya konu ara..."
            className="input-field pl-9 py-2"
          />
        </div>
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          className="input-field py-2 w-auto"
        >
          <option value="">Tüm Zorluklar</option>
          {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="input-field py-2 w-auto"
        >
          <option value="">Tüm Tipler</option>
          {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button
          onClick={() => setFilters({ ...filters, isFavorite: !filters.isFavorite })}
          className={cn('btn-ghost py-2', filters.isFavorite && 'text-amber-500 bg-amber-50 dark:bg-amber-900/20')}
        >
          <Star className={cn('w-4 h-4', filters.isFavorite && 'fill-amber-400')} />
          Favoriler
        </button>
        <span className="text-sm text-gray-400 ml-auto">{questions.length} soru</span>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        <AnimatePresence>
          {questions.map((q: any) => (
            <QuestionCard
              key={q.id}
              q={q}
              onDelete={(id: string) => deleteMutation.mutate(id)}
              onFavorite={(id: string) => favMutation.mutate(id)}
            />
          ))}
        </AnimatePresence>

        {questions.length === 0 && !isLoading && (
          <div className="text-center py-16 text-gray-400">
            <Sigma className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Soru bulunamadı</p>
            <p className="text-sm mt-1">AI ile soru üretin veya manuel ekleyin</p>
            <div className="flex items-center gap-3 justify-center mt-4">
              <button onClick={() => setShowAI(true)} className="btn-secondary text-sm">
                <Wand2 className="w-4 h-4" /> AI ile Üret
              </button>
              <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> Manuel Ekle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Generator Modal */}
      <AnimatePresence>
        {showAI && (
          <AIGeneratorModal
            onClose={() => setShowAI(false)}
            onGenerated={(qs: any[]) => bulkCreateMutation.mutate(qs)}
          />
        )}
      </AnimatePresence>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-2xl shadow-modal p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title">Yeni Soru Ekle</h3>
                <button onClick={() => { setShowAdd(false); reset(); }} className="btn-ghost p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="label">Soru Başlığı *</label>
                  <input {...register('title', { required: true })} className="input-field" placeholder="Kısa ve açıklayıcı başlık" />
                </div>

                <div>
                  <label className="label">Soru Metni *</label>
                  <textarea {...register('body', { required: true })} className="input-field resize-none" rows={4} placeholder="Soru metnini giriniz..." />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Konu *</label>
                    <input {...register('topic', { required: true })} className="input-field" list="topics-list" placeholder="Konu" />
                    <datalist id="topics-list">
                      {topics.map((t: string) => <option key={t} value={t} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="label">Sınıf Aralığı</label>
                    <select {...register('gradeLevel')} className="input-field">
                      {['4-5','5-6','6-7','7-8','9-10','10-11','11-12'].map((g) => (
                        <option key={g} value={g}>{g}. Sınıf</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Zorluk</label>
                    <select {...register('difficulty')} className="input-field">
                      {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Soru Tipi</label>
                    <select {...register('type')} className="input-field">
                      {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Süre (saniye)</label>
                    <input {...register('duration', { valueAsNumber: true })} type="number" className="input-field" placeholder="180" />
                  </div>
                </div>

                <div>
                  <label className="label">Doğru Cevap</label>
                  <input {...register('correctAnswer')} className="input-field" placeholder="Cevap veya seçenek harfi" />
                </div>

                <div>
                  <label className="label">Çözüm</label>
                  <textarea {...register('solution')} className="input-field resize-none" rows={3} placeholder="Adım adım çözüm..." />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAdd(false); reset(); }} className="btn-secondary flex-1 justify-center">İptal</button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
                    {createMutation.isPending ? 'Ekleniyor...' : 'Soruyu Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
