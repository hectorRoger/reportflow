'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { useApp } from '@/lib/context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, authReady } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (authReady && !currentUser) router.push('/login')
  }, [authReady, currentUser, router])

  if (!authReady) return null
  if (!currentUser) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}
