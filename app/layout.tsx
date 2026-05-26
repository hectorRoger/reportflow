import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/lib/context'
import { ToastProvider } from '@/components/toast'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'ReportFlow — RISA Reporting Platform',
  description: 'Structured reporting and progress tracking for government programs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 font-[family-name:var(--font-geist)]">
        <AppProvider><ToastProvider>{children}</ToastProvider></AppProvider>
      </body>
    </html>
  )
}
