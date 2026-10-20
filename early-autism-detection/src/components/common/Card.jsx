const CARD_AS = ['div', 'section', 'article', 'li']

export default function Card({
  as = 'div',
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}) {
  const Tag = CARD_AS.includes(as) ? as : 'div'

  const variantClasses = {
    default: 'bg-white shadow-card border border-border',
    elevated: 'bg-white shadow-elevated border border-border',
    subtle: 'bg-surface-100 border border-border-muted',
    gradient:
      'bg-gradient-to-br from-primary-600 to-secondary-700 text-white border-transparent',
    interactive:
      'bg-white shadow-card border border-border hover:shadow-card-hover hover:border-primary-200 transition-shadow cursor-pointer',
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const classes = [
    variantClasses[variant] ?? variantClasses.default,
    paddingClasses[padding] ?? paddingClasses.md,
    'rounded-xl',
    className,
  ].join(' ')

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {title && (
          <h3 className="font-display text-lg font-bold text-surface-900">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-0.5 text-sm text-surface-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={className}>{children}</div>
}

export function CardFooter({ className = '', children }) {
  return (
    <div className={`mt-4 border-t border-border pt-4 ${className}`}>
      {children}
    </div>
  )
}