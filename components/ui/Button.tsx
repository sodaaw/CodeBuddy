import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none'
    
    const variants = {
      primary: cn(
        'bg-[#35c082] text-[#f5f5f5] rounded-[10px] font-semibold',
        'hover:bg-[#3ecf8e] hover:shadow-[0_0_0_1px_rgba(62,207,142,0.25),0_0_16px_rgba(62,207,142,0.12)]',
        'active:bg-accent-hover active:shadow-[0_0_0_1px_rgba(62,207,142,0.2),0_0_12px_rgba(62,207,142,0.1)]'
      ),
      secondary: cn(
        'bg-transparent border border-[rgba(255,255,255,0.08)] text-text-primary rounded-[10px]',
        'hover:border-[rgba(255,255,255,0.14)] hover:text-text-primary',
        'active:border-[rgba(255,255,255,0.12)]',
        'transition-colors duration-150 ease-out'
      ),
      ghost: cn(
        'text-text-secondary rounded-[8px]',
        'hover:text-text-primary hover:bg-background-secondary',
        'active:bg-background-tertiary'
      ),
    }
    
    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-[8px]',
      md: 'h-10 px-4 text-sm rounded-[10px]',
      lg: 'h-12 px-6 text-base rounded-[10px]',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
