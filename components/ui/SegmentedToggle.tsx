import React from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedToggleProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex rounded-[10px] bg-background-tertiary p-1',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-[8px] transition-all duration-150 ease-out',
            value === option.value
              ? 'bg-background-secondary text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
