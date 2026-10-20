const VARIANTS = {
  success: 'bg-success-50 text-success-700 border-success-600/20',
  warning: 'bg-warning-50 text-warning-700 border-warning-600/20',
  danger: 'bg-danger-50 text-danger-700 border-danger-600/20',
  info: 'bg-info-50 text-info-700 border-info-600/20',
  primary: 'bg-primary-50 text-primary-700 border-primary-600/20',
  secondary: 'bg-secondary-50 text-secondary-700 border-secondary-600/20',
  accent: 'bg-accent-50 text-accent-700 border-accent-600/20',
  neutral: 'bg-surface-100 text-surface-600 border-surface-300/60',
  solid: 'bg-primary-600 text-white border-primary-700',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon: IconComponent,
  dot = false,
  className = '',
}) {
  const classes = [
    'inline-flex items-center gap-1.5 rounded-full border font-medium',
    VARIANTS[variant] ?? VARIANTS.neutral,
    SIZES[size] ?? SIZES.md,
    className,
  ].join(' ')

  return (
    <span className={classes}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {IconComponent && <IconComponent className="size-3.5" />}
      {children}
    </span>
  )
}