import React from 'react'
import { cn } from '@/lib/utils'

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        className={cn(
          'h-1.5 w-full appearance-none rounded-full bg-background-tertiary',
          'accent-accent',
          '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer',
          'transition-colors duration-150 ease-out',
          className
        )}
        {...props}
      />
    )
  }
)

Slider.displayName = 'Slider'
