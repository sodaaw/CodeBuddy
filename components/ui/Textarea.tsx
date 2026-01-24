import React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'min-h-[100px] w-full rounded-[10px] border border-border bg-background-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/10',
          'transition-all duration-200 ease-out',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'resize-none',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
