import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        'h-4 w-4 rounded border-input accent-primary focus:ring-1 focus:ring-ring',
        className,
      )}
      {...props}
    />
  ),
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
