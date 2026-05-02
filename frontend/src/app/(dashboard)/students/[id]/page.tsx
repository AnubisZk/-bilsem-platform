'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, School, Users, BookOpen, MessageSquare,
  Star, Target, Trash2, Brain, Key, ExternalLink,
  Edit, Camera, X, Plus, Cloud, FileText, CheckCircle,
  Wand2, Eye, Clock, ChevronRight, AlertCircle,
} from 'lucide-react';
import { studentsApi, feedbackApi, api } from '@/lib/api';
import { cn, getInitials, getMathLevelColor, getLevelLabel, formatRelativeDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const AVATAR_COLORS = ['from-brand-400 to-violet-400', 'from-emerald-400 to-teal-400', 'from-amber-400 to-orange-400', 'from-pink-400 to-rose-400', 'from-sky-400 to-blue-400'];
const MATH_LEVELS = ['Başlangıç', 'Gelişen', 'İleri', 'Üstün'];
const BILSEM_LEVELS = ['Özel Yetenekli 1', 'Özel Yetenekli 2', 'Özel Yetenekli 3', 'Lise'];

// ─── EDIT MODAL ─────────────────────────────────────────────────────────────
function EditStudentModal({ student, onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: student.name || '',
    surname: student.surname || '',
    school: student.school || '',
    grade: student.grade || 5,
    mathLevel: student.mathLevel || 'Gelişen',
    bilsemLevel: student.bilsemLevel || 'Özel Yetenekli 1',
    notes: student.notes || '',
    strengths: (student.strengths || []).join(', '),
    weaknesses: (student.weaknesses || []).join(', '),
    interests: (student.interests || []).join(', '),
  });

  function handleSave() {
    onSave({
      ...form,
      grade: Number(form.grade),
      strengths: form.strengths.split(',').map((s: string) => s.trim()).filter(Boolean),
      weaknesses: form.weaknesses.split(',').map((s: string) => s.trim()).filter(Boolean),
      interests: form.interests.split(',').map((s: string) => s.trim()).filter(Boolean),
    });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="card w-full max-w-lg shadow-modal p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">Öğrenci Düzenle</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Ad</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" /></div>
            <div><label className="label">Soyad</label><input value={form.surname} onChange={(e) => setForm({...form, surname: e.target.value})} className="input-field" /></div>
          </div>
          <div><label className="label">Okul</label><input value={form.school} onChange={(e) => setForm({...form, school: e.target.value})} className="input-field" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Sınıf</label>
              <select value={form.grade} onChange={(e) => setForm({...form, grade: Number(e.target.value)})} className="input-field">
                {Array.from({length: 9}, (_, i) => i + 4).map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
              </select>
            </div>
            <div>
              <label className="label">Matematik Seviyesi</label>
              <select value={form.mathLevel} onChange={(e) => setForm({...form, mathLevel: e.target.value})} className="input-field">
                {MATH_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">BİLSEM Kademesi</label>
              <select value={form.bilsemLevel} onChange={(e) => setForm({...form, bilsemLevel: e.target.value})} className="input-field">
                {BILSEM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Güçlü Yönler (virgülle ayırın)</label><input value={form.strengths} onChange={(e) => setForm({...form, strengths: e.target.value})} className="input-field" placeholder="Analitik düşünme, Problem çözme" /></div>
          <div><label className="label">Gelişim Alanları (virgülle ayırın)</label><input value={form.weaknesses} onChange={(e) => setForm({...form, weaknesses: e.target.value})} className="input-field" placeholder="Sözel problem kurma" /></div>
          <div><label className="label">İlgi Alanları (virgülle ayırın)</label><input value={form.interests} onChange={(e) => setForm({...form, interests: e.target.value})} className="input-field" placeholder="Matematik olimpiyatları" /></div>
          <div><label className="label">Notlar</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="input-field resize-none" rows={3} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button onClick={handleSave} className="btn-primary flex-1 justify-center">Kaydet</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── DRIVE RESOURCE MODAL ────────────────────────────────────────────────────
function DriveResourceModal({ studentId, onClose }: any) {
  const qc = useQueryClient();
  const [step, setStep] = useState<'auth' | 'files' | 'saving'>('auth');
  const [accessToken, setAccessToken] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function getAuthUrl() {
    const res = await api.get('/gdrive/auth-url');
    window.open(res.data.url, '_blank', 'width=500,height=600');
  }

  async function loadFiles() {
    if (!accessToken) { toast.error('Token giriniz'); return; }
    setLoading(true);
    try {
      const res = await api.get('/gdrive/files', { params: { accessToken } });
      setFiles(res.data);
      setStep('files');
    } catch { toast.error('Dosyalar yüklenemedi'); }
    finally { setLoading(false); }
  }

  async function assignResource() {
    if (!selected) { toast.error('Dosya seçiniz'); return; }
    setStep('saving');
    try {
      const res = await api.post(`/students/${studentId}/resources`, {
        fileName: selected.name,
        fileType: selected.mimeType?.includes('pdf') ? 'pdf' : 'docx',
        driveFileId: selected.id,
        driveUrl: selected.webViewLink,
        dueDate: dueDate || undefined,
      });
      toast.success('Kaynak atandı!');
      
      // AI plan oluştur
      setGenerating(true);
      try {
        const plan = await api.post(`/resources/${res.data.id}/generate-plan`, { accessToken });
        setResult({ resource: res.data, plan: plan.data });
        qc.invalidateQueries({ queryKey: ['student-resources', studentId] });
        toast.success('AI planı oluşturuldu!');
      } catch { toast.error('AI plan oluşturulamadı'); }
      finally { setGenerating(false); }
    } catch { toast.error('Kaynak atanamadı'); setStep('files'); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-lg shadow-modal p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-green-500" />
            <h3 className="section-title">Drive'dan Kaynak Ata</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        {step === 'auth' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <span className="block font-medium mb-1">Nasıl Çalışır?</span>
                <span className="block">1. Drive'a bağlanın → token alın</span>
                <span className="block">2. PDF veya Word dosyasını seçin</span>
                <span className="block">3. AI otomatik çalışma planı oluşturur</span>
              </p>
            </div>
            <button onClick={getAuthUrl} className="btn-secondary w-full justify-center">
              <Cloud className="w-4 h-4 text-green-500" /> Google Drive'a Bağlan
            </button>
            <div>
              <label className="label">Access Token</label>
              <textarea value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
                className="input-field resize-none font-mono text-xs" rows={3} placeholder="ya29.a0..." />
            </div>
            <button onClick={loadFiles} disabled={!accessToken || loading} className="btn-primary w-full justify-center">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yükleniyor...</span> : <><FileText className="w-4 h-4" /> Dosyaları Listele</>}
            </button>
          </div>
        )}

        {step === 'files' && (
          <div className="space-y-4">
            <div>
              <label className="label">Son Teslim Tarihi (opsiyonel)</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Drive Dosyaları ({files.length})</label>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {files.map((file: any) => (
                  <div key={file.id} onClick={() => setSelected(file)}
                    className={cn('flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all',
                      selected?.id === file.id ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100'
                    )}
                  >
                    <FileText className={cn('w-5 h-5 flex-shrink-0', selected?.id === file.id ? 'text-brand-500' : 'text-gray-400')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{file.size ? (Number(file.size) / 1024 / 1024).toFixed(1) + ' MB' : ''}</p>
                    </div>
                    {selected?.id === file.id && <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                  </div>
                ))}
                {files.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Drive klasöründe dosya bulunamadı</p>}
              </div>
            </div>
            {selected && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300"><strong>{selected.name}</strong> seçildi. AI plan oluşturulacak (1-2 dk).</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep('auth')} className="btn-secondary flex-1 justify-center">Geri</button>
              <button onClick={assignResource} disabled={!selected} className="btn-primary flex-1 justify-center">
                <Wand2 className="w-4 h-4" /> Ata ve Plan Oluştur
              </button>
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium text-gray-700 dark:text-gray-300">
              {generating ? 'AI planı oluşturuluyor...' : 'Kaynak atanıyor...'}
            </p>
            <p className="text-sm text-gray-400 mt-1">Bu işlem 1-2 dakika sürebilir</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <p className="font-medium text-emerald-700 dark:text-emerald-300">Tamamlandı!</p>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {result.plan?.planItems?.length || 0} konu başlığı ile plan oluşturuldu.
            </p>
            <p className="text-xs text-emerald-500 mt-1">Planı onaylayarak öğrenciye görünür yapabilirsiniz.</p>
            <button onClick={onClose} className="btn-primary mt-3 w-full justify-center">Tamam</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── RESOURCE CARD ───────────────────────────────────────────────────────────
function ResourceCard({ resource, onApprove, onChanged }: any) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const plan = resource.aiPlan;
  const items = plan?.planItems || [];

  const [planDraft, setPlanDraft] = useState({
    title: plan?.title || '',
    summary: plan?.summary || '',
  });

  const [draftItems, setDraftItems] = useState<any[]>([]);

  const completed = items.filter((i: any) => i.progress?.length > 0 && i.progress[0]?.isCompleted).length;
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;

  function refresh() {
    onChanged?.();
  }

  function startEdit() {
    if (!plan) return;
    setPlanDraft({
      title: plan.title || '',
      summary: plan.summary || '',
    });
    setDraftItems(items.map((item: any) => ({ ...item })));
    setExpanded(true);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraftItems([]);
  }

  function updateDraftItem(index: number, field: string, value: any) {
    setDraftItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addDraftItem() {
    setDraftItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        topic: 'Yeni konu',
        subtopic: '',
        description: '',
        estimatedQuestionCount: 10,
        suggestedDuration: 30,
        orderIndex: prev.length,
        teacherNote: '',
        studentGoal: '',
      },
    ]);
  }

  const updatePlanMutation = useMutation({
    mutationFn: (data: any) => api.put(`/resources/${resource.id}/plan`, data),
    onSuccess: () => {
      toast.success('Plan başlığı güncellendi');
      refresh();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Plan güncellenemedi');
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: () => api.delete(`/resources/${resource.id}/plan`),
    onSuccess: () => {
      toast.success('Plan silindi');
      setEditing(false);
      refresh();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Plan silinemedi');
    },
  });

  const saveItemMutation = useMutation({
    mutationFn: ({ item, index }: any) => {
      const payload = {
        topic: item.topic || 'Yeni konu',
        subtopic: item.subtopic || '',
        description: item.description || '',
        estimatedQuestionCount: Number(item.estimatedQuestionCount) || 0,
        suggestedDuration: Number(item.suggestedDuration) || 30,
        orderIndex: Number(item.orderIndex) || index,
        teacherNote: item.teacherNote || '',
        studentGoal: item.studentGoal || '',
      };

      if (String(item.id).startsWith('new-')) {
        return api.post(`/resources/${resource.id}/plan-items`, payload);
      }

      return api.put(`/resources/plan-items/${item.id}`, payload);
    },
    onSuccess: () => {
      toast.success('Plan maddesi kaydedildi');
      refresh();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Madde kaydedilemedi');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/resources/plan-items/${itemId}`),
    onSuccess: () => {
      toast.success('Plan maddesi silindi');
      refresh();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Madde silinemedi');
    },
  });

  async function savePlanHeader() {
    await updatePlanMutation.mutateAsync({
      title: planDraft.title,
      summary: planDraft.summary,
    });
  }

  async function savePlanItem(item: any, index: number) {
    await saveItemMutation.mutateAsync({ item, index });
  }

  function removeDraftItem(item: any, index: number) {
    if (String(item.id).startsWith('new-')) {
      setDraftItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    if (!confirm('Bu plan maddesi silinsin mi?')) return;

    deleteItemMutation.mutate(item.id);
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-green-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{resource.fileName}</p>
            <span className={cn('badge text-[10px]',
              resource.status === 'TAMAMLANDI' ? 'badge-green' :
              resource.status === 'DEVAM_EDIYOR' ? 'badge-brand' :
              resource.isVisible ? 'badge-gray' : 'bg-amber-50 text-amber-600'
            )}>
              {resource.status === 'TAMAMLANDI' ? 'Tamamlandı' :
               resource.status === 'DEVAM_EDIYOR' ? 'Devam Ediyor' :
               resource.isVisible ? 'Atandı' : 'Onay Bekliyor'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-gray-400">{items.length} konu</p>
            {resource.dueDate && <p className="text-xs text-gray-400">Son: {new Date(resource.dueDate).toLocaleDateString('tr-TR')}</p>}
          </div>

          {items.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">İlerleme</span>
                <span className="text-xs font-medium text-brand-500">%{progress}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                <div className="bg-brand-500 rounded-full h-1.5 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {plan && !editing && (
            <button onClick={startEdit} className="btn-secondary text-xs py-1.5 px-3">
              Planı Düzenle
            </button>
          )}

          {plan && !resource.isVisible && (
            <button onClick={() => onApprove(resource.id)} className="btn-primary text-xs py-1.5 px-3">
              <Eye className="w-3 h-3" /> Onayla
            </button>
          )}

          <button onClick={() => setExpanded(!expanded)} className="btn-ghost p-1.5">
            <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && plan && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">

              {!editing && (
                <>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{plan.title}</p>
                  {plan.summary && <p className="text-xs text-gray-500 mb-3">{plan.summary}</p>}

                  <div className="space-y-2">
                    {items.map((item: any, i: number) => {
                      const prog = item.progress?.[0];

                      return (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                            prog?.isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                          )}>
                            {prog?.isCompleted ? '✓' : i + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{item.topic}</p>
                            {item.subtopic && <p className="text-[10px] text-gray-400">{item.subtopic}</p>}
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />{item.suggestedDuration}dk
                          </div>

                          {prog && (
                            <div className="text-[10px] text-emerald-600 font-medium">
                              {prog.correctCount}/{prog.solvedCount}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {editing && (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-2">
                    <label className="block text-[11px] font-medium text-gray-500">Plan başlığı</label>
                    <input
                      value={planDraft.title}
                      onChange={(e) => setPlanDraft((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm"
                    />

                    <label className="block text-[11px] font-medium text-gray-500">Plan özeti</label>
                    <textarea
                      value={planDraft.summary}
                      onChange={(e) => setPlanDraft((p) => ({ ...p, summary: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm"
                    />

                    <div className="flex gap-2 flex-wrap">
                      <button onClick={savePlanHeader} disabled={updatePlanMutation.isPending} className="btn-primary text-xs py-1.5">
                        {updatePlanMutation.isPending ? 'Kaydediliyor...' : 'Başlığı Kaydet'}
                      </button>

                      <button onClick={addDraftItem} className="btn-secondary text-xs py-1.5">
                        Madde Ekle
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Bu kaynak için oluşturulan tüm AI planı silinsin mi?')) {
                            deletePlanMutation.mutate();
                          }
                        }}
                        disabled={deletePlanMutation.isPending}
                        className="btn-ghost text-xs py-1.5 text-red-500 hover:text-red-600"
                      >
                        Planı Sil
                      </button>

                      <button onClick={cancelEdit} className="btn-ghost text-xs py-1.5">
                        Kapat
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {draftItems.map((item: any, i: number) => (
                      <div key={item.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Madde {i + 1}</p>
                          <button onClick={() => removeDraftItem(item, i)} className="text-xs text-red-500 hover:text-red-600">
                            Sil
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            value={item.topic || ''}
                            onChange={(e) => updateDraftItem(i, 'topic', e.target.value)}
                            placeholder="Konu"
                            className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                          />

                          <input
                            value={item.subtopic || ''}
                            onChange={(e) => updateDraftItem(i, 'subtopic', e.target.value)}
                            placeholder="Alt konu"
                            className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                          />
                        </div>

                        <textarea
                          value={item.description || ''}
                          onChange={(e) => updateDraftItem(i, 'description', e.target.value)}
                          placeholder="Açıklama"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                        />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <input
                            type="number"
                            value={item.estimatedQuestionCount || 0}
                            onChange={(e) => updateDraftItem(i, 'estimatedQuestionCount', e.target.value)}
                            placeholder="Soru"
                            className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                          />

                          <input
                            type="number"
                            value={item.suggestedDuration || 30}
                            onChange={(e) => updateDraftItem(i, 'suggestedDuration', e.target.value)}
                            placeholder="Süre"
                            className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                          />

                          <input
                            type="number"
                            value={item.orderIndex ?? i}
                            onChange={(e) => updateDraftItem(i, 'orderIndex', e.target.value)}
                            placeholder="Sıra"
                            className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                          />

                          <button
                            onClick={() => savePlanItem(item, i)}
                            disabled={saveItemMutation.isPending}
                            className="btn-primary text-xs py-2 justify-center"
                          >
                            Kaydet
                          </button>
                        </div>

                        <input
                          value={item.studentGoal || ''}
                          onChange={(e) => updateDraftItem(i, 'studentGoal', e.target.value)}
                          placeholder="Öğrenci hedefi"
                          className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                        />

                        <input
                          value={item.teacherNote || ''}
                          onChange={(e) => updateDraftItem(i, 'teacherNote', e.target.value)}
                          placeholder="Öğretmen notu"
                          className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ANA SAYFA ───────────────────────────────────────────────────────────────
export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDrive, setShowDrive] = useState(false);
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

  const { data: resources = [] } = useQuery({
    queryKey: ['student-resources', id],
    queryFn: () => api.get(`/students/${id}/resources`).then((r) => r.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/students/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['student', id] }); setShowEdit(false); toast.success('Öğrenci güncellendi!'); },
    onError: () => toast.error('Güncelleme başarısız'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => studentsApi.delete(id as string),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Öğrenci silindi'); router.push('/students'); },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/students/${id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['student', id] }); toast.success('Fotoğraf yüklendi!'); },
    onError: () => toast.error('Fotoğraf yüklenemedi'),
  });

  const approveMutation = useMutation({
    mutationFn: (resourceId: string) => api.post(`/resources/${resourceId}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['student-resources', id] }); toast.success('Plan onaylandı ve öğrenciye gönderildi!'); },
  });

  async function createPortal() {
    setCreatingPortal(true);
    try {
      const res = await api.post(`/students/${id}/create-portal`);
      setPortalInfo(res.data);
      toast.success(res.data.exists ? 'Mevcut portal bilgileri' : 'Portal hesabı oluşturuldu!');
    } catch { toast.error('Portal oluşturulamadı'); }
    finally { setCreatingPortal(false); }
  }

  if (isLoading) return (
    <div className="space-y-5 max-w-5xl">
      <div className="shimmer-bg h-8 w-48 rounded-xl" />
      <div className="card p-6 space-y-4"><div className="shimmer-bg h-16 w-16 rounded-xl" /><div className="shimmer-bg h-6 w-48 rounded" /></div>
    </div>
  );
  if (!student) return null;

  const colorIndex = student.name.charCodeAt(0) % AVATAR_COLORS.length;
  const radarData = [
    { subject: 'Analitik', A: 75 }, { subject: 'Problem', A: 68 },
    { subject: 'Uzamsal', A: 82 }, { subject: 'Sayısal', A: 79 },
    { subject: 'Mantıksal', A: 71 }, { subject: 'Yaratıcı', A: 65 },
  ];
  const progressData = [
    { ay: 'Eyl', puan: 68 }, { ay: 'Eki', puan: 72 }, { ay: 'Kas', puan: 75 },
    { ay: 'Ara', puan: 74 }, { ay: 'Oca', puan: 79 }, { ay: 'Şub', puan: 83 },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      <Link href="/students"><button className="btn-ghost py-2 -ml-1"><ArrowLeft className="w-4 h-4" /> Öğrenciler</button></Link>

      {/* Üst kart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative group">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[colorIndex]} flex items-center justify-center text-white text-xl font-bold shadow-sm`}>
                  {getInitials(student.name, student.surname)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) avatarMutation.mutate(file); }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">{student.name} {student.surname}</h2>
              <div className="flex items-center gap-2 mt-1"><School className="w-3.5 h-3.5 text-gray-400" /><p className="text-sm text-gray-500">{student.school}</p></div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="badge badge-brand">{getLevelLabel(student.level)}</span>
                <span className={`badge ${getMathLevelColor(student.mathLevel)}`}>{student.mathLevel}</span>
                <span className="badge badge-gray">{student.grade}. Sınıf</span>
                <span className="badge badge-gray">{student.bilsemLevel}</span>
              </div>
            </div>
          </div>

          {/* Aksiyonlar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm py-2"><Edit className="w-4 h-4" /> Düzenle</button>
            <button onClick={() => setShowDrive(true)} className="btn-secondary text-sm py-2"><Cloud className="w-4 h-4 text-green-500" /> Kaynak Ata</button>
            <button onClick={createPortal} disabled={creatingPortal} className="btn-secondary text-sm py-2">
              <Key className="w-4 h-4" />{creatingPortal ? 'Oluşturuluyor...' : 'Portal'}
            </button>
            <a href="/portal" target="_blank" rel="noopener noreferrer">
              <button className="btn-primary text-sm py-2"><ExternalLink className="w-4 h-4" /> Portala Git</button>
            </a>
            <button onClick={() => { if (confirm(`${student.name} silinsin mi?`)) deleteMutation.mutate(); }} className="btn-ghost p-2 text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portal bilgileri */}
        {portalInfo && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">{portalInfo.exists ? '🔑 Mevcut Portal' : '✅ Portal Oluşturuldu!'}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <div><span className="font-medium">E-posta:</span> {portalInfo.email}</div>
              <div><span className="font-medium">Şifre:</span> {portalInfo.password}</div>
            </div>
          </motion.div>
        )}

        {/* İstatistikler */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-black/[0.04] dark:border-white/[0.04]">
          <div className="text-center"><p className="text-2xl font-bold font-display text-brand-500">{analytics?.totalActivities ?? '—'}</p><p className="text-xs text-gray-400 mt-1">Etkinlik</p></div>
          <div className="text-center"><p className="text-2xl font-bold font-display text-emerald-500">{analytics?.avgPerformance ?? '—'}/5</p><p className="text-xs text-gray-400 mt-1">Performans</p></div>
          <div className="text-center"><p className="text-2xl font-bold font-display text-amber-500">{student.feedbacks?.length ?? 0}</p><p className="text-xs text-gray-400 mt-1">Geri Bildirim</p></div>
          <div className="text-center"><p className="text-2xl font-bold font-display text-violet-500">{resources.length}</p><p className="text-xs text-gray-400 mt-1">Kaynak</p></div>
        </div>
      </motion.div>

      {/* Kaynaklar */}
      {resources.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Atanan Kaynaklar</h3>
            <button onClick={() => setShowDrive(true)} className="btn-ghost text-sm py-1.5"><Plus className="w-3.5 h-3.5" /> Ekle</button>
          </div>
          {resources.map((r: any) => (
            <ResourceCard key={r.id} resource={r} onApprove={(rid: string) => approveMutation.mutate(rid)} onChanged={() => qc.invalidateQueries({ queryKey: ['student-resources', id] })} />
          ))}
        </motion.div>
      )}

      {/* İki sütun */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sol */}
        <div className="space-y-4">
          {student.strengths?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4">
              <div className="flex items-center gap-2 mb-3"><Star className="w-4 h-4 text-amber-400" /><h4 className="font-medium text-gray-900 dark:text-white text-sm">Güçlü Yönler</h4></div>
              <div className="flex flex-wrap gap-1.5">{student.strengths.map((s: string) => <span key={s} className="badge badge-green text-xs">{s}</span>)}</div>
            </motion.div>
          )}
          {student.weaknesses?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-4">
              <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-red-400" /><h4 className="font-medium text-gray-900 dark:text-white text-sm">Gelişim Alanları</h4></div>
              <div className="flex flex-wrap gap-1.5">{student.weaknesses.map((w: string) => <span key={w} className="badge badge-red text-xs">{w}</span>)}</div>
            </motion.div>
          )}
          {student.groupStudents?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4">
              <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-brand-400" /><h4 className="font-medium text-gray-900 dark:text-white text-sm">Gruplar</h4></div>
              {student.groupStudents.map((gs: any) => (
                <div key={gs.group?.id} className="flex items-center gap-2 text-sm mb-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: gs.group?.color || '#6366f1' }} />
                  <span className="text-gray-700 dark:text-gray-300">{gs.group?.name}</span>
                </div>
              ))}
            </motion.div>
          )}
          {student.notes && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-4">
              <div className="flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-gray-400" /><h4 className="font-medium text-gray-900 dark:text-white text-sm">Notlar</h4></div>
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
                  <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
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
            <div className="flex items-center gap-2 mb-4"><BookOpen className="w-4 h-4 text-gray-400" /><h4 className="font-medium text-gray-900 dark:text-white text-sm">Son Etkinlikler</h4></div>
            <div className="space-y-2">
              {(student.studentLogs || []).slice(0, 6).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-8 h-8 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-brand-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{log.activityLog?.activity?.title || log.activityLog?.topic}</p>
                    <p className="text-xs text-gray-400">{formatRelativeDate(log.activityLog?.date)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }, (_, i) => <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i < log.performance ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700')} />)}
                  </div>
                </div>
              ))}
              {(student.studentLogs || []).length === 0 && <p className="text-sm text-gray-400 text-center py-6">Henüz etkinlik kaydı yok</p>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modaller */}
      <AnimatePresence>
        {showEdit && <EditStudentModal student={student} onClose={() => setShowEdit(false)} onSave={(data: any) => updateMutation.mutate(data)} />}
        {showDrive && <DriveResourceModal studentId={id} onClose={() => setShowDrive(false)} />}
      </AnimatePresence>
    </div>
  );
}
