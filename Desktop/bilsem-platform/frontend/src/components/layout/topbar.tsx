'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Search, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

const pageTitles: Record<string, string> = {
  '/dashboard':  'Ana Panel',
  '/students':   'Öğrenci Yönetimi',
  '/groups':     'Grup Yönetimi',
  '/activities': 'Etkinlik Kütüphanesi',
  '/questions':  'Soru Bankası',
  '/planner':    'Konu Planlayıcı',
  '/feedback':   'Geri Bildirim',
  '/analytics':  'Analitik',
  '/reports':    'Raporlar',
  '/settings':   'Ayarlar',
};

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  const title = Object.entries(pageTitles).find(
    ([key]) => pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )?.[1] || 'BİLSEM MIP';

  return (
    <header className="h-16 bg-white/80 dark:bg-[#1e1e1c]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] flex items-center px-6 gap-4 sticky top-0 z-30">
      <h1 className="font-semibold text-gray-900 dark:text-white text-[15px] font-display flex-1">
        {title}
      </h1>

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <motion.input
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            className="input-field pl-9 py-2 text-sm"
            placeholder="Öğrenci, etkinlik, soru ara..."
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="btn-ghost py-2"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Ara...</span>
          </button>
        )}
        {searchOpen && (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Notifications */}
      <button className="relative btn-ghost p-2">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="btn-ghost p-2"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}
