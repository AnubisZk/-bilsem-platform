'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersRound, Plus, X, UserPlus, UserMinus, BarChart3,
  BookOpen, ChevronRight, Settings, Trash2,
} from 'lucide-react';
import { groupsApi, studentsApi } from '@/lib/api';
import { cn, getInitials, getLevelLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const GROUP_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#e11d48'];

function GroupCard({ group, onSelect, isSelected }: any) {
  const memberCount = group.groupStudents?.length || 0;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => onSelect(group)}
      className={cn(
        'card p-5 cursor-pointer transition-all duration-200',
        isSelected && 'ring-2 ring-offset-2 ring-brand-500/50',
      )}
      style={isSelected ? { borderColor: group.color } : {}}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
          style={{ background: group.color }}
        >
          <UsersRound className="w-5 h-5" />
        </div>
        <span className="badge badge-gray text-[10px]">{getLevelLabel(group.level)}</span>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{group.name}</h3>
      {group.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{group.description}</p>
      )}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.04] text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <UsersRound className="w-3 h-3" />{memberCount} öğrenci
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />{group._count?.activityLogs || 0} etkinlik
        </span>
      </div>
    </motion.div>
  );
}

export default function GroupsPage() {
  const qc = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.list().then((r) => r.data),
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { data: groupDetail } = useQuery({
    queryKey: ['group', selectedGroup?.id],
    queryFn: () => groupsApi.get(selectedGroup.id).then((r) => r.data),
    enabled: !!selectedGroup?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => groupsApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setShowCreate(false);
      setSelectedGroup(res.data);
      toast.success('Grup oluşturuldu!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setSelectedGroup(null);
      toast.success('Grup silindi');
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: ({ groupId, studentId }: any) => groupsApi.addStudent(groupId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', selectedGroup?.id] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Öğrenci gruba eklendi');
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: ({ groupId, studentId }: any) => groupsApi.removeStudent(groupId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', selectedGroup?.id] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Öğrenci gruptan çıkarıldı');
    },
  });

  const { register, handleSubmit, reset, watch } = useForm<any>({
    defaultValues: { color: '#6366f1', level: 'ILKOGRETIM' },
  });

  const groupMemberIds = new Set((groupDetail?.groupStudents || []).map((gs: any) => gs.student.id));
  const availableStudents = allStudents.filter((s: any) => !groupMemberIds.has(s.id));

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Grup Yönetimi</h2>
          <p className="text-sm text-gray-400 mt-0.5">{groups.length} aktif grup</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)} className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Yeni Grup
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Groups grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 content-start">
          {isLoading ? (
            [1,2,3].map((i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="shimmer-bg h-11 w-11 rounded-xl" />
                <div className="shimmer-bg h-4 w-3/4 rounded" />
                <div className="shimmer-bg h-3 w-1/2 rounded" />
              </div>
            ))
          ) : (
            <>
              {groups.map((g: any) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  onSelect={setSelectedGroup}
                  isSelected={selectedGroup?.id === g.id}
                />
              ))}
              {groups.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-400">
                  <UsersRound className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz grup yok</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Group detail */}
        <div className="lg:col-span-3">
          {groupDetail ? (
            <div className="card p-5 space-y-5">
              {/* Group header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: groupDetail.color }}
                  >
                    <UsersRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{groupDetail.name}</h3>
                    <p className="text-xs text-gray-400">{getLevelLabel(groupDetail.level)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAddStudent(true)} className="btn-secondary text-xs py-1.5 px-3">
                    <UserPlus className="w-3.5 h-3.5" /> Öğrenci Ekle
                  </button>
                  <button onClick={() => deleteMutation.mutate(groupDetail.id)} className="btn-ghost p-1.5 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Öğrenciler ({groupDetail.groupStudents?.length || 0})
                  </p>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {(groupDetail.groupStudents || []).map((gs: any) => (
                      <motion.div
                        key={gs.student.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(gs.student.name, gs.student.surname)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {gs.student.name} {gs.student.surname}
                          </p>
                          <p className="text-xs text-gray-400">{gs.student.school} • {gs.student.grade}. Sınıf</p>
                        </div>
                        <span className="text-xs text-gray-400">{gs.student.mathLevel}</span>
                        <button
                          onClick={() => removeStudentMutation.mutate({ groupId: groupDetail.id, studentId: gs.student.id })}
                          className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-red-400 transition-opacity"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {groupDetail.groupStudents?.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <UsersRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Bu grupta henüz öğrenci yok</p>
                      <button onClick={() => setShowAddStudent(true)} className="btn-primary text-xs mt-3">
                        <UserPlus className="w-3.5 h-3.5" /> Öğrenci Ekle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent logs */}
              {groupDetail.activityLogs?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Son Etkinlikler</p>
                  <div className="space-y-2">
                    {groupDetail.activityLogs.slice(0, 4).map((log: any) => (
                      <div key={log.id} className="flex items-center gap-3 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400 flex-1 truncate">
                          {log.activity?.title || log.topic}
                        </span>
                        <span className="text-gray-400 flex-shrink-0">
                          %{log.completion} tamamlandı
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-10 flex flex-col items-center justify-center text-gray-400 h-full min-h-64">
              <UsersRound className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Grup Seçin</p>
              <p className="text-sm mt-1">Sol taraftan bir grup seçerek detayları görün</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
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
              className="card w-full max-w-md shadow-modal p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title">Yeni Grup Oluştur</h3>
                <button onClick={() => { setShowCreate(false); reset(); }} className="btn-ghost p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="label">Grup Adı *</label>
                  <input {...register('name', { required: true })} className="input-field" placeholder="İlköğretim A Grubu" />
                </div>
                <div>
                  <label className="label">Açıklama</label>
                  <input {...register('description')} className="input-field" placeholder="Grup hakkında kısa açıklama" />
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
                    <label className="label">Grup Rengi</label>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {GROUP_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => reset({ ...watch(), color })}
                          className={cn(
                            'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                            watch('color') === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent',
                          )}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="btn-secondary flex-1 justify-center">İptal</button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
                    {createMutation.isPending ? 'Oluşturuluyor...' : 'Grup Oluştur'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddStudent && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowAddStudent(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-md shadow-modal p-6 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Öğrenci Ekle</h3>
                <button onClick={() => setShowAddStudent(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">{groupDetail?.name}</span> grubuna öğrenci ekleyin
              </p>
              <div className="overflow-y-auto flex-1 space-y-2">
                {availableStudents.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">Tüm öğrenciler bu grupta</p>
                ) : (
                  availableStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(s.name, s.surname)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name} {s.surname}</p>
                        <p className="text-xs text-gray-400">{s.grade}. Sınıf • {s.mathLevel}</p>
                      </div>
                      <button
                        onClick={() => {
                          addStudentMutation.mutate({ groupId: groupDetail.id, studentId: s.id });
                          setShowAddStudent(false);
                        }}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        <UserPlus className="w-3 h-3" /> Ekle
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
