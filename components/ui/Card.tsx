import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'outlined', children, ...props }, ref) => {
    const variants = {
      default: 'bg-background-secondary',
      outlined: 'bg-background-secondary border border-[rgba(255,255,255,0.06)]',
    }

    return (
      <div
        ref={ref}
        className={cn('rounded-[10px] p-4', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
