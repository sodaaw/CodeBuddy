import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-border bg-background-secondary px-3 text-sm text-text-primary placeholder:text-text-muted',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          'transition-colors duration-150 ease-out',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
