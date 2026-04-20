'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Notebook, Pin, Plus, Trash2, X,
  User, Bell, Shield, Palette, ExternalLink, Cloud,
} from 'lucide-react';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('notes');
  const [showAddNote, setShowAddNote] = useState(false);

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: () => usersApi.notes().then((r) => r.data),
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: any) => usersApi.createNote(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); setShowAddNote(false); toast.success('Not eklendi!'); },
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => usersApi.pinNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const { register, handleSubmit, reset } = useForm<any>();

  const tabs = [
    { key: 'notes',    label: 'Not Defteri', icon: Notebook },
    { key: 'profile',  label: 'Profil',      icon: User },
    { key: 'gdrive',   label: 'Google Drive', icon: Cloud },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="page-title">Ayarlar</h2>
        <p className="text-sm text-gray-400 mt-0.5">Profil, entegrasyonlar ve kişisel araçlar</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white dark:bg-[#2e2e2c] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Notes tab */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{notes.length} not</p>
            <button onClick={() => setShowAddNote(true)} className="btn-primary text-sm py-2">
              <Plus className="w-4 h-4" /> Not Ekle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {notes.map((note: any) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className={`card p-4 ${note.isPinned ? 'border-brand-200 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-900/10' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{note.title}</h4>
                    <button onClick={() => pinMutation.mutate(note.id)} className={`flex-shrink-0 ${note.isPinned ? 'text-brand-500' : 'text-gray-300 hover:text-gray-500'}`}>
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 leading-relaxed">{note.content}</p>
                  {note.tags?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {note.tags.slice(0,3).map((tag: string) => (
                        <span key={tag} className="badge badge-brand text-[10px]">{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3">{formatRelativeDate(note.updatedAt)}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            {notes.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <Notebook className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz not yok</p>
                <p className="text-xs mt-1">Ders notları, gözlemler, fikirler...</p>
              </div>
            )}
          </div>

          {/* Add note modal */}
          <AnimatePresence>
            {showAddNote && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && setShowAddNote(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card w-full max-w-md shadow-modal p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="section-title">Yeni Not</h3>
                    <button onClick={() => { setShowAddNote(false); reset(); }} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={handleSubmit((d) => createNoteMutation.mutate(d))} className="space-y-4">
                    <div>
                      <label className="label">Başlık *</label>
                      <input {...register('title', { required: true })} className="input-field" placeholder="Not başlığı..." />
                    </div>
                    <div>
                      <label className="label">İçerik *</label>
                      <textarea {...register('content', { required: true })} className="input-field resize-none" rows={6} placeholder="Not içeriği..." />
                    </div>
                    <div>
                      <label className="label">Etiketler (virgülle ayırın)</label>
                      <input {...register('tags')} className="input-field" placeholder="matematik, 7.sınıf, olimpiyat" />
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setShowAddNote(false); reset(); }} className="btn-secondary flex-1 justify-center">İptal</button>
                      <button type="submit" disabled={createNoteMutation.isPending} className="btn-primary flex-1 justify-center">Kaydet</button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="card p-6 max-w-md">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-violet-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.charAt(0) || 'Ö'}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white font-display">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="badge badge-brand text-xs mt-1">{user?.teacher?.title || user?.role}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Kurum</label>
              <input value={user?.teacher?.institution || 'Altıeylül BİLSEM'} readOnly className="input-field bg-gray-50 dark:bg-gray-800/50" />
            </div>
            <div>
              <label className="label">E-posta</label>
              <input value={user?.email || ''} readOnly className="input-field bg-gray-50 dark:bg-gray-800/50" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Profil bilgilerini güncellemek için sistem yöneticinizle iletişime geçin.</p>
        </div>
      )}

      {/* Google Drive tab */}
      {tab === 'gdrive' && (
        <div className="card p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <Cloud className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Google Drive Entegrasyonu</h3>
              <p className="text-xs text-gray-400">Etkinlik kitaplarını Drive'dan yükleyin</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Nasıl Çalışır?</p>
              <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1.5">
                <li>1. Google hesabınızla bağlanın</li>
                <li>2. Etkinlik kitaplarının bulunduğu klasörü seçin</li>
                <li>3. PDF'ler otomatik olarak sisteme aktarılır</li>
                <li>4. OCR ile soru metinleri ayıklanır</li>
              </ol>
            </div>

            <div>
              <label className="label">Drive Klasör ID</label>
              <input className="input-field" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs..." />
              <p className="text-xs text-gray-400 mt-1">Drive'da klasörü açıp URL'den ID'yi kopyalayın</p>
            </div>

            <button className="btn-primary w-full justify-center">
              <Cloud className="w-4 h-4" /> Google Drive'a Bağlan
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ExternalLink className="w-3.5 h-3.5" />
              <a href="https://docs.anthropic.com" target="_blank" className="hover:text-brand-500">
                Entegrasyon dokümantasyonu
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
