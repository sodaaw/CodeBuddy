'use client'

import { useAuth } from '@/lib/contexts/AuthContext'
import { TopNav } from '@/components/navigation/TopNav'
import { BottomTabBar } from '@/components/navigation/BottomTabBar'
import Link from 'next/link'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Top Navigation - only show when logged in */}
      {isLoggedIn && (
        <header className="hidden md:block border-b border-[rgba(255,255,255,0.06)] bg-background">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img 
                src="/logobright.png" 
                alt="AlgoMemory" 
                className="h-6 w-6"
              />
              <span className="text-lg font-medium text-text-primary">AlgoMemory</span>
            </Link>
            <TopNav />
          </div>
        </header>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Mobile Bottom Navigation - only show when logged in */}
      {isLoggedIn && <BottomTabBar />}
    </div>
  )
}
