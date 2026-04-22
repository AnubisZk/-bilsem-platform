'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Wand2, Plus, Send, X, Star,
  Eye, ChevronDown, CheckCircle, User, Clock, Sparkles,
} from 'lucide-react';
import { feedbackApi, studentsApi } from '@/lib/api';
import { cn, formatRelativeDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const STATUS_BADGE: Record<string, string> = {
  TASLAK:    'badge-gray',
  GONDERILDI:'badge-green',
  OKUNDU:    'badge-brand',
};
const STATUS_LABEL: Record<string, string> = {
  TASLAK: 'Taslak', GONDERILDI: 'Gönderildi', OKUNDU: 'Okundu',
};

function FeedbackCard({ fb, onSend }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-violet-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {getInitials(fb.student?.name || '', fb.student?.surname)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {fb.student?.name} {fb.student?.surname}
              </p>
              <p className="text-xs text-gray-400">{fb.period}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {fb.aiGenerated && (
                <span className="flex items-center gap-1 text-[10px] text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              )}
              <span className={`badge text-[10px] ${STATUS_BADGE[fb.status]}`}>
                {STATUS_LABEL[fb.status]}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{fb.strengths}</p>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 border-t border-black/[0.05] dark:border-white/[0.05] pt-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">Güçlü Yönler</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{fb.strengths}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">Gelişim Alanları</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{fb.improvements}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400 mb-1">Sonraki Hedefler</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{fb.nextGoals}</p>
                  </div>
                  {fb.motivation && (
                    <div className="bg-gradient-to-r from-brand-50 to-violet-50 dark:from-brand-900/20 dark:to-violet-900/20 rounded-xl p-3">
                      <p className="text-xs text-brand-700 dark:text-brand-300 italic">💬 {fb.motivation}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => setExpanded(!expanded)} className="btn-ghost py-1 px-2 text-xs">
              <Eye className="w-3 h-3" /> {expanded ? 'Gizle' : 'Detaylar'}
            </button>
            {fb.status === 'TASLAK' && (
              <button onClick={() => onSend(fb.id)} className="btn-primary py-1 px-3 text-xs">
                <Send className="w-3 h-3" /> Gönder
              </button>
            )}
            <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatRelativeDate(fb.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeedbackPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [aiPeriod, setAiPeriod] = useState('2024-2025 Güz');
  const [generating, setGenerating] = useState(false);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => feedbackApi.list().then((r) => r.data),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => feedbackApi.send(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feedbacks'] }); toast.success('Geri bildirim gönderildi!'); },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => feedbackApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feedbacks'] }); setShowCreate(false); toast.success('Geri bildirim oluşturuldu!'); },
  });

  const { register, handleSubmit, reset } = useForm<any>();

  async function handleAIGenerate() {
    if (!selectedStudentId) return toast.error('Öğrenci seçin');
    setGenerating(true);
    try {
      await feedbackApi.generateAI(selectedStudentId, aiPeriod);
      qc.invalidateQueries({ queryKey: ['feedbacks'] });
      setShowCreate(false);
      toast.success('AI geri bildirimi oluşturuldu!');
    } catch {
      toast.error('AI oluşturamadı');
    } finally {
      setGenerating(false);
    }
  }

  const pending = feedbacks.filter((f: any) => f.status === 'TASLAK').length;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Geri Bildirim</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {feedbacks.length} toplam • {pending} bekleyen gönderim
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setAiMode(true); setShowCreate(true); }}
            className="btn-secondary"
          >
            <Wand2 className="w-4 h-4 text-violet-500" /> AI ile Oluştur
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setAiMode(false); setShowCreate(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Yeni Geri Bildirim
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Taslak', count: feedbacks.filter((f: any) => f.status === 'TASLAK').length, color: 'text-gray-500' },
          { label: 'Gönderildi', count: feedbacks.filter((f: any) => f.status === 'GONDERILDI').length, color: 'text-emerald-500' },
          { label: 'Okundu', count: feedbacks.filter((f: any) => f.status === 'OKUNDU').length, color: 'text-brand-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        <AnimatePresence>
          {feedbacks.map((fb: any) => (
            <FeedbackCard key={fb.id} fb={fb} onSend={(id: string) => sendMutation.mutate(id)} />
          ))}
        </AnimatePresence>

        {feedbacks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Henüz geri bildirim yok</p>
            <p className="text-sm mt-1">Öğrencilere geri bildirim oluşturmaya başlayın</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-lg shadow-modal p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  {aiMode && <Wand2 className="w-4 h-4 text-violet-500" />}
                  <h3 className="section-title">
                    {aiMode ? 'AI Geri Bildirim Oluştur' : 'Geri Bildirim Yaz'}
                  </h3>
                </div>
                <button onClick={() => { setShowCreate(false); reset(); }} className="btn-ghost p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aiMode ? (
                <div className="space-y-4">
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                    <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
                      Claude API, seçilen öğrencinin etkinlik geçmişini ve performans verilerini analiz ederek otomatik geri bildirim oluşturacak.
                    </p>
                  </div>
                  <div>
                    <label className="label">Öğrenci *</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Öğrenci seçin</option>
                      {students.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} {s.surname}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Dönem</label>
                    <input
                      value={aiPeriod}
                      onChange={(e) => setAiPeriod(e.target.value)}
                      className="input-field"
                      placeholder="2024-2025 Güz"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">İptal</button>
                    <button
                      onClick={handleAIGenerate}
                      disabled={generating || !selectedStudentId}
                      className="btn-primary flex-1 justify-center bg-violet-500 hover:bg-violet-600"
                    >
                      {generating ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Oluşturuluyor...
                        </span>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> AI ile Oluştur</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Öğrenci *</label>
                      <select {...register('studentId', { required: true })} className="input-field">
                        <option value="">Seçin</option>
                        {students.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} {s.surname}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Dönem</label>
                      <input {...register('period')} className="input-field" defaultValue="2024-2025 Güz" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Güçlü Yönler *</label>
                    <textarea {...register('strengths', { required: true })} className="input-field resize-none" rows={3} placeholder="Öğrencinin öne çıkan güçlü yönleri..." />
                  </div>
                  <div>
                    <label className="label">Gelişim Alanları *</label>
                    <textarea {...register('improvements', { required: true })} className="input-field resize-none" rows={3} placeholder="Geliştirilmesi önerilen alanlar..." />
                  </div>
                  <div>
                    <label className="label">Sonraki Hedefler *</label>
                    <textarea {...register('nextGoals', { required: true })} className="input-field resize-none" rows={2} placeholder="Önümüzdeki dönem için hedefler..." />
                  </div>
                  <div>
                    <label className="label">Motivasyon Mesajı</label>
                    <input {...register('motivation')} className="input-field" placeholder="Teşvik edici kısa mesaj..." />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="btn-secondary flex-1 justify-center">İptal</button>
                    <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
                      {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
