import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'tr-TR') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  return formatDate(date);
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'KOLAY':     return 'badge-green';
    case 'ORTA':      return 'badge-amber';
    case 'ZOR':       return 'badge-red';
    case 'OLIMPIYAT': return 'badge-purple';
    default:          return 'badge-gray';
  }
}

export function getDifficultyLabel(difficulty: string) {
  const map: Record<string, string> = {
    KOLAY: 'Kolay', ORTA: 'Orta', ZOR: 'Zor', OLIMPIYAT: 'Olimpiyat',
  };
  return map[difficulty] || difficulty;
}

export function getLevelLabel(level: string) {
  return level === 'ILKOGRETIM' ? 'İlköğretim' : 'Lise';
}

export function getMathLevelColor(level: string) {
  const map: Record<string, string> = {
    'Başlangıç': 'badge-gray',
    'Gelişen':   'badge-amber',
    'İleri':     'badge-brand',
    'Üstün':     'badge-purple',
  };
  return map[level] || 'badge-gray';
}

export function getInitials(name: string, surname?: string) {
  if (surname) return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  const parts = name.split(' ');
  return parts.map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase();
}

export const GRADE_OPTIONS = [
  '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf',
  '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf',
  '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf',
];

export const MATH_LEVELS = ['Başlangıç', 'Gelişen', 'İleri', 'Üstün'];
export const BILSEM_LEVELS = [
  'Özel Yetenekli 1', 'Özel Yetenekli 2', 'Özel Yetenekli 3', 'Lise',
];
export const DIFFICULTY_OPTIONS = ['KOLAY', 'ORTA', 'ZOR', 'OLIMPIYAT'];
export const QUESTION_TYPES = [
  { value: 'COGUL_SECMELI', label: 'Çoktan Seçmeli' },
  { value: 'ACIK_UCLU',     label: 'Açık Uçlu' },
  { value: 'DOGRU_YANLIS',  label: 'Doğru/Yanlış' },
  { value: 'ESLESTIRME',    label: 'Eşleştirme' },
  { value: 'ZEKA',          label: 'Zeka Sorusu' },
  { value: 'PROBLEM_COZME', label: 'Problem Çözme' },
  { value: 'OLIMPIYAT',     label: 'Olimpiyat' },
  { value: 'ETKINLIK',      label: 'Etkinlik' },
  { value: 'MINI_QUIZ',     label: 'Mini Quiz' },
];
