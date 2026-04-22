'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, UsersRound, BookOpen, Brain,
  CalendarDays, MessageSquare, BarChart3, FileText,
  Notebook, Settings, LogOut, Sigma,
} from 'lucide-react';
import { useAuthStore } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Genel',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
      { href: '/students',  icon: Users,           label: 'Öğrenciler' },
      { href: '/groups',    icon: UsersRound,       label: 'Gruplar' },
    ],
  },
  {
    label: 'Öğretim',
    items: [
      { href: '/activities', icon: BookOpen,     label: 'Etkinlik Kütüphanesi' },
      { href: '/questions',  icon: Sigma,         label: 'Soru Bankası' },
      { href: '/planner',    icon: CalendarDays,  label: 'Konu Planlayıcı' },
    ],
  },
  {
    label: 'Değerlendirme',
    items: [
      { href: '/feedback',   icon: MessageSquare, label: 'Geri Bildirim' },
      { href: '/analytics',  icon: BarChart3,      label: 'Analitik' },
      { href: '/reports',    icon: FileText,       label: 'Raporlar' },
    ],
  },
  {
    label: 'Araçlar',
    items: [
      { href: '/settings',  icon: Settings,  label: 'Ayarlar' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#1e1e1c] border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm font-display text-gray-900 dark:text-white leading-tight">BİLSEM MIP</p>
          <p className="text-xs text-gray-400 truncate">Math Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'nav-link',
                        isActive && 'active',
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500"
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-violet-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0) || 'Ö'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
              {user?.name || 'Öğretmen'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.teacher?.title || user?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
            title="Çıkış Yap"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
