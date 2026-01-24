'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface NavItem {
  label: string
  href: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/home' },
  { label: 'Log', href: '/log' },
  { label: 'Review', href: '/review' },
  { label: 'Report', href: '/report', disabled: true },
]

export const TopNav: React.FC = () => {
  const pathname = usePathname()
  const { isLoggedIn, logout } = useAuth()

  if (!isLoggedIn) {
    return null
  }

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const isDisabled = item.disabled

        return (
          <Link
            key={item.href}
            href={isDisabled ? '#' : item.href}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-out',
              isDisabled
                ? 'opacity-40 cursor-not-allowed text-text-muted'
                : isActive
                ? 'text-accent bg-accent-muted'
                : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
            )}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault()
              }
            }}
          >
            {item.label}
          </Link>
        )
      })}
      <div className="ml-4 pl-4 border-l border-border">
        <Button variant="ghost" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </nav>
  )
}
