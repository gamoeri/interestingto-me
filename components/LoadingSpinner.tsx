// components/ui/LoadingSpinner.tsx
import { cn } from '@/lib/utils'

export function LoadingSpinner({
  size = 'medium',
  className
}: {
  size?: 'small' | 'medium' | 'large'
  className?: string
}) {
  const sizes = {
    small: 'h-5 w-5 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-solid border-current border-r-transparent',
        sizes[size],
        className
      )}
      role="status"
    />
  )
}