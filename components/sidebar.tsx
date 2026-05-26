'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, ClipboardList,
  BarChart3, LogOut, ChevronRight, Users, PlusCircle, Bell, Search,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { roleLabel, roleBadgeColor } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

type NavItem = { href: string; label: string; icon: React.ElementType; roles?: UserRole[]; badge?: boolean }

const NAV: NavItem[] = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/tasks',      label: 'My Tasks',     icon: ClipboardList,
    roles: ['staff', 'division_manager'] },
  { href: '/approvals',  label: 'Approvals',    icon: Bell,
    roles: ['division_manager', 'c_level', 'ceo'], badge: true },
  { href: '/team',       label: 'Team Reports', icon: Users,
    roles: ['division_manager', 'c_level', 'ceo'] },
  { href: '/tasks/new',  label: 'Create Task',  icon: PlusCircle,
    roles: ['division_manager', 'c_level', 'ceo'] },
  { href: '/reports',    label: 'Reports',      icon: FileText,
    roles: ['c_level', 'ceo'] },
  { href: '/progress',   label: 'Progress',     icon: BarChart3,
    roles: ['division_manager', 'c_level', 'ceo'] },
]

export function Sidebar({ onClose, onSearch }: { onClose?: () => void; onSearch?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout, tasks } = useApp()
  const role = currentUser?.role

  const visibleNav = NAV.filter(item => !item.roles || (role && item.roles.includes(role)))
  const pendingCount = tasks.filter(t => t.status === 'submitted').length

  function handleLogout() {
    logout()
    onClose?.()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-indigo-900 text-white flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-indigo-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center font-bold text-sm">RF</div>
          <div>
            <p className="font-semibold text-sm leading-tight">ReportFlow</p>
            <p className="text-indigo-300 text-xs">RISA Platform</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <button
        onClick={onSearch}
        className="mx-3 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-indigo-300 hover:text-white transition-colors text-sm"
      >
        <Search size={14} />
        <span className="flex-1 text-left text-xs">Search…</span>
        <kbd className="text-[10px] bg-indigo-700 px-1 rounded font-mono opacity-70">⌘K</kbd>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const count = badge ? pendingCount : 0
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {count}
                </span>
              )}
              {active && count === 0 && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {currentUser && (
        <div className="px-4 py-4 border-t border-indigo-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block ${roleBadgeColor(currentUser.role)}`}>
                {roleLabel(currentUser.role)}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-indigo-300 hover:text-white text-xs w-full py-1.5 px-2 rounded hover:bg-indigo-800 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </aside>
  )
}
