'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';
import {
  LayoutDashboard, UserMinus, Brain, MessageSquare, Map,
  BarChart3, Settings, LogOut, Shield,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/departures', label: 'Departures', icon: UserMinus },
  { href: '/knowledge', label: 'Knowledge Base', icon: Brain },
  { href: '/risk-map', label: 'Risk Map', icon: Map },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, org, logout } = useAuth();

  return (
    <aside className="flex flex-col w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-brand-400" />
          <div>
            <h1 className="text-lg font-bold">OffboardIQ</h1>
            <p className="text-xs text-gray-400">{org?.name || 'Organization'}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            pathname.startsWith(href)
              ? 'bg-brand-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white',
          )}>
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 mt-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
