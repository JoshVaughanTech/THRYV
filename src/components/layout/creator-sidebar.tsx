'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Zap,
  LayoutGrid,
  FileText,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CreatorSidebarProps {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/builder', label: 'Programs', icon: FileText },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function CreatorSidebar({ profile }: CreatorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = (profile.full_name || 'C')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#0A0A0A] border-r border-[#1E1E1E] flex flex-col z-40">
      {/* Logo + Badge */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-[#B4F000]" />
          <span className="text-lg font-bold text-white tracking-[2px]">THRYV</span>
          <span className="ml-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-[1px] bg-[#B4F000] text-[#0A0A0A]">
            Creator
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#B4F000] text-[#0A0A0A]'
                  : 'text-[#888888] hover:bg-[#141414] hover:text-white'
              )}
            >
              <item.icon className={clsx('h-[18px] w-[18px]', isActive && 'stroke-[2.5px]')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Sign Out */}
      <div className="border-t border-[#1E1E1E] p-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#B4F000] flex items-center justify-center text-sm font-bold text-[#B4F000]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile.full_name || 'Creator'}</p>
            <p className="text-[11px] text-[#888888]">PRO Creator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-[#555555] hover:bg-[#141414] hover:text-[#888888] transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
