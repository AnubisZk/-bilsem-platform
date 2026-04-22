'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Plus, Wand2, X, ChevronDown, ChevronRight,
  Clock, Target, BookOpen, Trash2, Check,
} from 'lucide-react';
import { plansApi, groupsApi } from '@/lib/api';
import { cn, formatDate, getLevelLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function PlannerPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [useAI, setUseAI] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list().then((r) => r.data),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.list().then((r) => r.data),
  });

  const { data: planDetail } = useQuery({
    queryKey: ['plan', selectedPlan?.id],
    queryFn: () => plansApi.get(selectedPlan.id).then((r) => r.data),
    enabled: !!selectedPlan?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      useAI ? plansApi.generateAI(data) : plansApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      setShowCreate(false);
      setSelectedPlan(res.data);
      toast.success(useAI ? 'AI plan oluşturuldu!' : 'Plan oluşturuldu!');
    },
    onError: () => toast.error('Plan oluşturulamadı'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => plansApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      setSelectedPlan(null);
      toast.success('Plan silindi');
    },
  });

  const { register, handleSubmit, watch } = useForm<any>({
    defaultValues: {
      level: 'ILKOGRETIM',
      weeklyHours: 4,
      gradeLevel: '6-7',
    },
  });

  const groupedItems = planDetail?.planItems?.reduce((acc: any, item: any) => {
    if (!acc[item.week]) acc[item.week] = [];
    acc[item.week].push(item);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Konu Dağılımı Planlayıcı</h2>
          <p className="text-sm text-gray-400 mt-0.5">Dönemlik konu dağılımı ve haftalık plan oluşturun</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Yeni Plan
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Plans list */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 px-1">Planlarım ({plans.length})</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="card p-4 space-y-2">
                  <div className="shimmer-bg h-4 w-3/4 rounded" />
                  <div className="shimmer-bg h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((plan: any) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    'card p-4 cursor-pointer transition-all',
                    selectedPlan?.id === plan.id && 'ring-2 ring-brand-500/30 border-brand-200 dark:border-brand-800',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{plan.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {getLevelLabel(plan.level)} • {plan.gradeLevel}. Sınıf
                      </p>
                    </div>
                    <span className="badge badge-gray text-[10px] flex-shrink-0 ml-2">
                      {plan._count?.planItems || 0} hafta
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{plan.weeklyHours} sa/hafta
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {plan.group?.name || 'Tüm Grup'}
                    </span>
                  </div>
                </motion.div>
              ))}

              {plans.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Plan yok</p>
                  <p className="text-xs mt-1">AI ile hızlıca oluşturun</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Plan detail */}
        <div className="lg:col-span-2">
          {selectedPlan && planDetail ? (
            <div className="card p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{planDetail.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(planDetail.startDate)} — {formatDate(planDetail.endDate)}
                  </p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(planDetail.id)}
                  className="btn-ghost p-1.5 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {Object.entries(groupedItems).map(([week, items]: any) => (
                  <div key={week} className="border border-black/[0.06] dark:border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                      <div className="w-7 h-7 bg-brand-500 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {week}
                      </div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {week}. Hafta
                      </p>
                    </div>
                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {items.map((item: any) => (
                        <div key={item.id} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-gray-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.topic}</p>
                              {item.objectives?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {item.objectives.slice(0, 2).map((obj: string, i: number) => (
                                    <p key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                                      <Target className="w-3 h-3 flex-shrink-0 mt-0.5 text-brand-400" />
                                      {obj}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{item.duration} dk
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(groupedItems).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Bu planda henüz hafta yok</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-10 flex flex-col items-center justify-center text-gray-400 h-full min-h-64">
              <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Plan Seçin</p>
              <p className="text-sm mt-1">Sol taraftan bir plan seçin veya yeni plan oluşturun</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-sm">
                <Wand2 className="w-4 h-4" /> AI Plan Oluştur
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-lg shadow-modal p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title">Yeni Plan Oluştur</h3>
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
              </div>

              {/* AI toggle */}
              <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl mb-5">
                <Wand2 className="w-4 h-4 text-violet-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-violet-800 dark:text-violet-200">AI Destekli Plan</p>
                  <p className="text-xs text-violet-600 dark:text-violet-400">Claude API ile otomatik konu dağılımı</p>
                </div>
                <button
                  onClick={() => setUseAI(!useAI)}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors',
                    useAI ? 'bg-violet-500' : 'bg-gray-200 dark:bg-gray-700',
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5',
                    useAI ? 'translate-x-5' : 'translate-x-0',
                  )} />
                </button>
              </div>

              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="label">Plan Adı *</label>
                  <input {...register('title', { required: true })} className="input-field" placeholder="2024-2025 Güz Dönemi Planı" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Kademe</label>
                    <select {...register('level')} className="input-field">
                      <option value="ILKOGRETIM">İlköğretim</option>
                      <option value="LISE">Lise</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Sınıf</label>
                    <select {...register('gradeLevel')} className="input-field">
                      {['4-5','5-6','6-7','7-8','9-10','10-11','11-12'].map((g) => (
                        <option key={g} value={g}>{g}. Sınıf</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Başlangıç Tarihi</label>
                    <input {...register('startDate', { required: true })} type="date" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Bitiş Tarihi</label>
                    <input {...register('endDate', { required: true })} type="date" className="input-field" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Haftalık Saat: {watch('weeklyHours')}</label>
                    <input {...register('weeklyHours', { valueAsNumber: true })} type="range" min="1" max="12" className="w-full accent-brand-500 mt-3" />
                  </div>
                  <div>
                    <label className="label">Grup (İsteğe Bağlı)</label>
                    <select {...register('groupId')} className="input-field">
                      <option value="">Grup seçme</option>
                      {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>

                {useAI && (
                  <div>
                    <label className="label">Odak Alanları (İsteğe Bağlı)</label>
                    <input
                      {...register('focusAreas')}
                      className="input-field"
                      placeholder="Olimpiyat, analitik düşünme, problem çözme..."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">İptal</button>
                  <button type="submit" disabled={createMutation.isPending} className={cn('flex-1 justify-center', useAI ? 'btn-primary bg-violet-500 hover:bg-violet-600' : 'btn-primary')}>
                    {createMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {useAI ? 'AI oluşturuyor...' : 'Kaydediliyor...'}
                      </span>
                    ) : (
                      <>
                        {useAI && <Wand2 className="w-4 h-4" />}
                        {useAI ? 'AI ile Oluştur' : 'Plan Oluştur'}
                      </>
                    )}
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
