'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { useApp } from '@/lib/context'

function Skeleton() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl animate-pulse" />
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, authReady } = useApp()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (authReady && !currentUser) router.push('/login')
  }, [authReady, currentUser, router])

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [])

  if (!authReady) return <Skeleton />
  if (!currentUser) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — slide in on mobile, always visible on desktop */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden shrink-0 flex items-center justify-between
          px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50
              rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">RF</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">ReportFlow</span>
          </div>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700
            flex items-center justify-center text-xs font-bold">
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
