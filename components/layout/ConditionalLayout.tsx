'use client'

import { useAuth } from '@/lib/contexts/AuthContext'
import { TopNav } from '@/components/navigation/TopNav'
import { BottomTabBar } from '@/components/navigation/BottomTabBar'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Top Navigation - only show when logged in */}
      {isLoggedIn && (
        <header className="hidden md:block border-b border-border bg-background-secondary">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-text-primary">CodeBuddy</span>
            </div>
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
