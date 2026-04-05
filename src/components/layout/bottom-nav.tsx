'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Home, LayoutGrid, BarChart3, User } from 'lucide-react';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/my-programs', label: 'Programs', icon: LayoutGrid },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1A1A1A] bg-[#0A0A0A] lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-4 py-1.5 min-w-[56px]',
                isActive ? 'text-[#B4F000]' : 'text-[#555555]'
              )}
            >
              <item.icon
                className="h-[22px] w-[22px]"
                fill={isActive ? 'currentColor' : 'none'}
                strokeWidth={isActive ? 0 : 2}
              />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
