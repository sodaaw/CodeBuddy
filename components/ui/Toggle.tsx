import React from 'react'
import { cn } from '@/lib/utils'

export interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            'sr-only peer',
            className
          )}
          {...props}
        />
        <div className="relative w-11 h-6 rounded-full bg-background-tertiary peer-checked:bg-accent transition-colors duration-150 ease-out">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-150 ease-out peer-checked:translate-x-5" />
        </div>
        {label && <span className="text-sm text-text-secondary">{label}</span>}
      </label>
    )
  }
)

Toggle.displayName = 'Toggle'
