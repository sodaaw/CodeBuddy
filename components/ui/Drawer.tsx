'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  side?: 'left' | 'right' | 'bottom'
  className?: string
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'bottom',
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const sideClasses = {
    left: 'left-0 top-0 bottom-0 w-80',
    right: 'right-0 top-0 bottom-0 w-80',
    bottom: 'left-0 right-0 bottom-0 max-h-[80vh]',
  }

  return (
    <div
      className={cn('fixed inset-0 z-50', className)}
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute z-10 rounded-t-lg border-t border-border bg-background-secondary',
          sideClasses[side]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          {title && (
            <h2 className="text-lg font-medium text-text-primary mb-4">{title}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
