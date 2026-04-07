'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Zap,
  Home,
  Search,
  Calendar,
  User,
  PenTool,
  LayoutDashboard,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface SidebarProps {
  profile: Profile;
}

const userNav = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/programs', label: 'Discover', icon: Search },
  { href: '/my-programs', label: 'My Programs', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
];

const creatorNav = [
  { href: '/builder', label: 'Program Builder', icon: PenTool },
  { href: '/dashboard', label: 'Creator Dashboard', icon: LayoutDashboard },
];

const adminNav = [
  { href: '/admin', label: 'Admin Panel', icon: Shield },
];

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-bg-secondary border-r border-border-secondary flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border-secondary">
        <Link href="/home" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-accent-primary" />
          <span className="text-lg font-bold text-text-primary tracking-tight">THRYV</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav role="navigation" aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <p className="px-3 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Training
          </p>
          {userNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {(profile.role === 'creator' || profile.role === 'admin') && (
          <div className="mb-4">
            <p className="px-3 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Creator
            </p>
            {creatorNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        {profile.role === 'admin' && (
          <div className="mb-4">
            <p className="px-3 text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Admin
            </p>
            {adminNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-border-secondary p-3 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
