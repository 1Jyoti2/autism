import { Loader2 } from 'lucide-react'

const SIZES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
}

const LABELS = {
  sm: 'Loading',
  md: 'Loading',
  lg: 'Loading',
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  label,
  center = false,
}) {
  const spinner = (
    <>
      <Loader2
        className={`animate-spin text-current ${SIZES[size] ?? SIZES.md}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label ?? LABELS[size] ?? 'Loading'}</span>
    </>
  )

  if (center) {
    return (
      <div role="status" className={`flex w-full items-center justify-center ${className}`}>
        {spinner}
      </div>
    )
  }

  return (
    <span role="status" className={`inline-flex items-center ${className}`}>
      {spinner}
    </span>
  )
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-64 flex-1 items-center justify-center text-primary-600">
      <LoadingSpinner size="lg" label={label} />
    </div>
  )
}