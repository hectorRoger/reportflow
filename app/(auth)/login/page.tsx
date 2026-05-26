'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import type { UserRole } from '@/lib/types'

const demoAccounts: { label: string; sub: string; email: string; role: UserRole; color: string }[] = [
  {
    label: 'CEO',
    sub: 'Tony · Full visibility',
    email: 'ceo@risa.gov.rw',
    role: 'ceo',
    color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
  },
  {
    label: 'C-Level',
    sub: 'Roger · CTO · ICT Infrastructure Directorate',
    email: 'cto@risa.gov.rw',
    role: 'c_level',
    color: 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50',
  },
  {
    label: 'Division Manager',
    sub: 'Bruce · Network Operations Division',
    email: 'manager@risa.gov.rw',
    role: 'division_manager',
    color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
  },
  {
    label: 'Staff',
    sub: 'Victor · Connectivity Unit',
    email: 'staff@risa.gov.rw',
    role: 'staff',
    color: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
  },
]

const roleColors: Record<UserRole, string> = {
  ceo: 'bg-purple-100 text-purple-700',
  c_level: 'bg-indigo-100 text-indigo-700',
  division_manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-600',
}

function getRedirect(role: UserRole): string {
  return role === 'staff' ? '/tasks' : '/dashboard'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, allUsers } = useApp()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const ok = login(email.trim())
    if (ok) {
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
      router.push(getRedirect(user?.role ?? 'staff'))
    } else {
      setError('No account found with that email. Use a demo account below.')
      setLoading(false)
    }
  }

  function quickLogin(acc: typeof demoAccounts[0]) {
    login(acc.email)
    router.push(getRedirect(acc.role))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500 rounded-2xl mb-4">
            <span className="text-white font-bold text-xl">RF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ReportFlow</h1>
          <p className="text-indigo-300 text-sm mt-1">RISA Government Reporting Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@risa.gov.rw"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                defaultValue="demo"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mb-4">— or sign in as a demo account —</p>

          <div className="space-y-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                onClick={() => quickLogin(acc)}
                className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl transition-all text-left group ${acc.color}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[acc.role]}`}>
                    {acc.label}
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-gray-700">{acc.sub}</span>
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 text-sm">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
