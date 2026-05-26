'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Users, Bell, BarChart3 } from 'lucide-react'
import { useApp } from '@/lib/context'
import type { UserRole } from '@/lib/types'

type NavItem = { href: string; label: string; icon: React.ElementType; roles?: UserRole[] }

const BOTTOM_NAV: NavItem[] = [
  { href: '/dashboard',  label: 'Home',     icon: LayoutDashboard },
  { href: '/tasks',      label: 'Tasks',    icon: ClipboardList,
    roles: ['staff', 'division_manager'] },
  { href: '/approvals',  label: 'Review',   icon: Bell,
    roles: ['division_manager', 'c_level', 'ceo'] },
  { href: '/team',       label: 'Team',     icon: Users,
    roles: ['division_manager', 'c_level', 'ceo'] },
  { href: '/progress',   label: 'Progress', icon: BarChart3,
    roles: ['division_manager', 'c_level', 'ceo'] },
]

export function BottomNav() {
  const pathname = usePathname()
  const { currentUser, tasks } = useApp()
  const role = currentUser?.role

  const visibleNav = BOTTOM_NAV.filter(item => !item.roles || (role && item.roles.includes(role)))

  // Badge count for approvals
  const pendingCount = tasks.filter(t => t.status === 'submitted').length

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200
      flex items-stretch safe-area-inset-bottom">
      {visibleNav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        const isBell = href === '/approvals'
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative
              transition-colors min-h-[56px]
              ${active ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {isBell && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px]
                  font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium leading-none ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
