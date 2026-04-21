'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Clock, Target, Play, X,
  ChevronRight, Layers, CheckCircle, Cloud, Wand2,
  Download, FileText, AlertCircle,
} from 'lucide-react';
import { activitiesApi, groupsApi, api } from '@/lib/api';
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
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{activity.title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{activity.module?.name}</p>
        </div>
        <span className={`badge text-[10px] flex-shrink-0 ${getDifficultyColor(activity.difficulty)}`}>
          {getDifficultyLabel(activity.difficulty)}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">{activity.description}</p>
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.duration} dk</span>
        <span className="flex items-center gap-1"><Target className="w-3 h-3" />{activity.topic}</span>
        <span className="flex items-center gap-1 ml-auto"><Play className="w-3 h-3" />{activity.usageCount}× kullanıldı</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(activity.skills || []).slice(0, 3).map((skill: string, i: number) => (
          <span key={skill} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>{skill}</span>
        ))}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mb-4 space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Kazanımlar</p>
              {(activity.objectives || []).map((obj: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">{obj}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2">
        <button onClick={() => setExpanded(!expanded)} className="btn-ghost py-1.5 px-3 text-xs flex-1 justify-center">
          {expanded ? 'Gizle' : 'Detaylar'}<ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
        </button>
        <button onClick={() => onApply(activity)} className="btn-primary py-1.5 px-4 text-xs">
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
      participation: 4, completion: 90, duration: activity.duration,
      topic: activity.topic, homeworkGiven: false,
    },
  });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} className="card w-full max-w-md shadow-modal p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">Ders Kaydı</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl mb-4">
          <p className="text-xs font-medium text-brand-700 dark:text-brand-300">{activity.title}</p>
          <p className="text-xs text-brand-500">{activity.topic} • {activity.duration} dk</p>
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
            <label className="label">Katılım: {watch('participation')}/5</label>
            <input {...register('participation', { valueAsNumber: true })} type="range" min="1" max="5" className="w-full accent-brand-500" />
          </div>
          <div>
            <label className="label">Tamamlanma: %{watch('completion')}</label>
            <input {...register('completion', { valueAsNumber: true })} type="range" min="0" max="100" step="5" className="w-full accent-brand-500" />
          </div>
          <div>
            <label className="label">Notlar</label>
            <textarea {...register('notes')} className="input-field resize-none" rows={2} placeholder="Ders notu..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" className="btn-primary flex-1 justify-center"><CheckCircle className="w-4 h-4" /> Kaydet</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DriveImportModal({ modules, onClose }: any) {
  const qc = useQueryClient();
  const [step, setStep] = useState<'auth' | 'files' | 'importing'>('auth');
  const [accessToken, setAccessToken] = useState('');
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ILKOGRETIM');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function getAuthUrl() {
    try {
      const res = await api.get('/gdrive/auth-url');
      window.open(res.data.url, '_blank', 'width=500,height=600');
    } catch {
      toast.error('Auth URL alınamadı');
    }
  }

  async function loadFiles() {
    if (!accessToken) { toast.error('Access token giriniz'); return; }
    setLoadingFiles(true);
    try {
      const res = await api.get('/gdrive/files', { params: { accessToken } });
      setDriveFiles(res.data);
      setStep('files');
      if (res.data.length === 0) toast('Drive klasöründe dosya bulunamadı', { icon: '⚠️' });
    } catch {
      toast.error('Dosyalar yüklenemedi');
    } finally {
      setLoadingFiles(false);
    }
  }

  async function importActivities() {
    if (!selectedFile || !selectedModule) { toast.error('Dosya ve modül seçiniz'); return; }
    setStep('importing');
    try {
      const res = await api.post('/activities/import-from-drive', {
        fileId: selectedFile.id,
        accessToken,
        moduleId: selectedModule,
        level: selectedLevel,
      });
      setResult(res.data);
      qc.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${res.data.imported} etkinlik içe aktarıldı!`);
    } catch {
      toast.error('İçe aktarma başarısız');
      setStep('files');
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} className="card w-full max-w-lg shadow-modal p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Cloud className="w-4 h-4 text-green-500" />
            </div>
            <h3 className="section-title">Drive'dan İçe Aktar</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        {step === 'auth' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Nasıl Çalışır?</p>
              <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>1. Google hesabınızla Drive'a bağlanın</li>
                <li>2. Dönen access token'ı kopyalayın</li>
                <li>3. PDF etkinlik kitabını seçin</li>
                <li>4. AI otomatik etkinlikleri çıkarır</li>
              </ol>
            </div>
            <div>
              <button onClick={getAuthUrl} className="btn-secondary w-full justify-center mb-3">
                <Cloud className="w-4 h-4 text-green-500" /> Google Drive'a Bağlan (Yeni Sekme)
              </button>
              <label className="label">Gelen Access Token'ı Yapıştırın</label>
              <textarea
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="input-field resize-none font-mono text-xs"
                rows={3}
                placeholder="ya29.a0Aa7MY..."
              />
            </div>
            <button
              onClick={loadFiles}
              disabled={!accessToken || loadingFiles}
              className="btn-primary w-full justify-center"
            >
              {loadingFiles ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Dosyalar yükleniyor...
                </span>
              ) : (
                <><FileText className="w-4 h-4" /> Drive Dosyalarını Listele</>
              )}
            </button>
          </div>
        )}

        {step === 'files' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Modül *</label>
                <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="input-field">
                  <option value="">Modül seçin</option>
                  {modules.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Kademe</label>
                <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="input-field">
                  <option value="ILKOGRETIM">İlköğretim</option>
                  <option value="LISE">Lise</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Drive'daki PDF Dosyaları ({driveFiles.length})</label>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {driveFiles.map((file: any) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                      selectedFile?.id === file.id
                        ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <FileText className={cn('w-5 h-5 flex-shrink-0', selectedFile?.id === file.id ? 'text-brand-500' : 'text-gray-400')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{file.size ? (Number(file.size) / 1024 / 1024).toFixed(1) + ' MB' : ''}</p>
                    </div>
                    {selectedFile?.id === file.id && <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>{selectedFile.name}</strong> dosyasından etkinlikler çıkarılacak. Bu işlem 1-2 dakika sürebilir.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('auth')} className="btn-secondary flex-1 justify-center">Geri</button>
              <button
                onClick={importActivities}
                disabled={!selectedFile || !selectedModule}
                className="btn-primary flex-1 justify-center"
              >
                <Wand2 className="w-4 h-4" /> AI ile İçe Aktar
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium text-gray-700 dark:text-gray-300">AI etkinlikleri analiz ediyor...</p>
            <p className="text-sm text-gray-400 mt-1">PDF okunuyor ve etkinlikler çıkarılıyor</p>
            <p className="text-xs text-gray-400 mt-3">Bu işlem 1-3 dakika sürebilir</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <p className="font-medium text-emerald-700 dark:text-emerald-300">İçe Aktarma Tamamlandı!</p>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{result.imported} etkinlik sisteme eklendi.</p>
            <button onClick={onClose} className="btn-primary mt-3 w-full justify-center">Kapat</button>
          </div>
        )}
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
  const [showDriveImport, setShowDriveImport] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Etkinlik Kütüphanesi</h2>
          <p className="text-sm text-gray-400 mt-0.5">{activities.length} etkinlik mevcut</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowDriveImport(true)}
            className="btn-secondary"
          >
            <Cloud className="w-4 h-4 text-green-500" />
            Drive'dan İçe Aktar
          </motion.button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'modules' : 'grid')}
            className="btn-secondary"
          >
            <Layers className="w-4 h-4" />
            {viewMode === 'grid' ? 'Modül Görünümü' : 'Tüm Etkinlikler'}
          </button>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Etkinlik ara..." className="input-field pl-9 py-2" />
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
      </div>

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
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-brand-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{a.title}</p>
                      <p className="text-[10px] text-gray-400">{a.topic}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {activities.map((activity: any) => (
              <ActivityCard key={activity.id} activity={activity} onApply={(a: any) => setSelectedActivity(a)} />
            ))}
          </AnimatePresence>
          {activities.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Etkinlik bulunamadı</p>
              <button onClick={() => setShowDriveImport(true)} className="btn-primary mt-4 text-sm">
                <Cloud className="w-4 h-4" /> Drive'dan İçe Aktar
              </button>
            </div>
          )}
        </div>
      )}

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

      <AnimatePresence>
        {showDriveImport && (
          <DriveImportModal
            modules={modules}
            onClose={() => setShowDriveImport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
