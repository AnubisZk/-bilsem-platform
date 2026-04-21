'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Users, School, TrendingUp,
  ChevronRight, Star, MoreHorizontal, X, BookOpen, Trash2,
} from 'lucide-react';
import { studentsApi } from '@/lib/api';
import {
  cn, getInitials, getMathLevelColor, getLevelLabel,
  formatDate, GRADE_OPTIONS, MATH_LEVELS, BILSEM_LEVELS,
} from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

const LEVEL_COLORS: Record<string, string> = {
  ILKOGRETIM: 'badge-brand',
  LISE:       'badge-purple',
};

const AVATAR_COLORS = [
  'from-brand-400 to-violet-400',
  'from-emerald-400 to-teal-400',
  'from-amber-400 to-orange-400',
  'from-pink-400 to-rose-400',
  'from-sky-400 to-blue-400',
];

export default function StudentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => studentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      setShowAdd(false);
      toast.success('Öğrenci başarıyla eklendi!');
    },
    onError: () => toast.error('Öğrenci eklenemedi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success('Öğrenci silindi');
    },
    onError: () => toast.error('Silinemedi'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const filtered = students.filter((s: any) => {
    const matchSearch =
      !search ||
      `${s.name} ${s.surname}`.toLowerCase().includes(search.toLowerCase()) ||
      s.school?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = !levelFilter || s.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Öğrenciler</h2>
          <p className="text-sm text-gray-400 mt-0.5">{students.length} kayıtlı öğrenci</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdd(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Öğrenci Ekle
        </motion.button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya okul ara..."
            className="input-field pl-9 py-2"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="input-field py-2 w-auto"
        >
          <option value="">Tüm Kademeler</option>
          <option value="ILKOGRETIM">İlköğretim</option>
          <option value="LISE">Lise</option>
        </select>
        {(search || levelFilter) && (
          <button onClick={() => { setSearch(''); setLevelFilter(''); }} className="btn-ghost py-2 text-red-500">
            <X className="w-4 h-4" /> Temizle
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} öğrenci</span>
      </div>

      {/* Student grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="shimmer-bg h-12 w-12 rounded-xl" />
              <div className="shimmer-bg h-4 w-3/4 rounded" />
              <div className="shimmer-bg h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((student: any, i: number) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Link href={`/students/${student.id}`}>
                  <div className="card-hover p-5 cursor-pointer group">
                    {/* Avatar */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                        {getInitials(student.name, student.surname)}
                      </div>
                      <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm(student.name + ' silinsin mi?')) deleteMutation.mutate(student.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {student.name} {student.surname}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <School className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400 truncate">{student.school}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span className={`badge text-[10px] ${LEVEL_COLORS[student.level]}`}>
                        {getLevelLabel(student.level)}
                      </span>
                      <span className={`badge text-[10px] ${getMathLevelColor(student.mathLevel)}`}>
                        {student.mathLevel}
                      </span>
                      <span className="badge badge-gray text-[10px]">{student.grade}. Sınıf</span>
                    </div>

                    {/* Groups */}
                    {student.groupStudents?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-gray-400" />
                          <p className="text-[10px] text-gray-400 truncate">
                            {student.groupStudents.map((gs: any) => gs.group?.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {student._count?.activityLogs || 0} etkinlik
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Öğrenci bulunamadı</p>
              <p className="text-sm mt-1">Yeni öğrenci ekleyin veya filtre kriterlerini değiştirin</p>
            </div>
          )}
        </div>
      )}

      {/* Add Student Modal */}
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
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card w-full max-w-lg shadow-modal p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title">Yeni Öğrenci Ekle</h3>
                <button onClick={() => setShowAdd(false)} className="btn-ghost p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit((d) => createMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Ad *</label>
                    <input {...register('name', { required: true })} className="input-field" placeholder="Emir" />
                  </div>
                  <div>
                    <label className="label">Soyad *</label>
                    <input {...register('surname', { required: true })} className="input-field" placeholder="Yıldız" />
                  </div>
                </div>

                <div>
                  <label className="label">Okul *</label>
                  <input {...register('school', { required: true })} className="input-field" placeholder="Atatürk Ortaokulu" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Sınıf *</label>
                    <select {...register('grade', { required: true, valueAsNumber: true })} className="input-field">
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={i+1}>{i+1}. Sınıf</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Kademe *</label>
                    <select {...register('level', { required: true })} className="input-field">
                      <option value="ILKOGRETIM">İlköğretim</option>
                      <option value="LISE">Lise</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">BİLSEM Seviyesi</label>
                    <select {...register('bilsemLevel')} className="input-field">
                      {BILSEM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Matematik Seviyesi</label>
                    <select {...register('mathLevel')} className="input-field">
                      {MATH_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Notlar</label>
                  <textarea
                    {...register('notes')}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Öğrenci hakkında notlar..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAdd(false); reset(); }} className="btn-secondary flex-1 justify-center">
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary flex-1 justify-center"
                  >
                    {createMutation.isPending ? 'Ekleniyor...' : 'Öğrenci Ekle'}
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
