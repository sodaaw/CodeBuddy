'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 150)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const typeStyles = {
    success: 'bg-accent-muted text-accent border-accent/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-background-tertiary text-text-secondary border-border',
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
        'px-4 py-3 rounded-lg border text-sm font-medium',
        'transition-opacity duration-150 ease-out',
        typeStyles[type]
      )}
    >
      {message}
    </div>
  )
}
