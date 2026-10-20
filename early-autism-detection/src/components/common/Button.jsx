import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner'

const VARIANTS = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-300 shadow-card',
  secondary:
    'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-300 shadow-card',
  accent:
    'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-300 shadow-card',
  outline:
    'border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-400 focus:ring-surface-300',
  ghost: 'text-surface-600 hover:bg-surface-100 hover:text-surface-800',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-300 shadow-card',
  success:
    'bg-success-600 text-white hover:bg-success-700 focus:ring-success-300 shadow-card',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2',
  icon: 'h-10 w-10 rounded-lg',
}

function ButtonContent({ loading, loadingLabel, children }) {
  if (loading) {
    return (
      <>
        <LoadingSpinner size="sm" />
        <span className="sr-only">{loadingLabel ?? 'Loading…'}</span>
      </>
    )
  }
  return children
}

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel,
    disabled = false,
    fullWidth = false,
    className = '',
    type = 'button',
    title,
    as,
    to,
    href,
    ...props
  },
  ref,
) {
  const classes = [
    'inline-flex items-center justify-center font-semibold transition-all duration-150 whitespace-nowrap',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    size === 'icon' ? 'p-0' : '',
    loading ? 'cursor-wait opacity-80' : '',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <ButtonContent loading={loading} loadingLabel={loadingLabel}>
      {children}
    </ButtonContent>
  )
  const isDisabled = disabled || loading

  if (to || as === 'link') {
    return (
      <Link
        ref={ref}
        to={to ?? '#'}
        className={classes}
        aria-disabled={isDisabled}
        {...(isDisabled ? { tabIndex: -1 } : {})}
        {...props}
      >
        {content}
      </Link>
    )
  }

  if (href || as === 'anchor') {
    return (
      <a
        ref={ref}
        href={href ?? '#'}
        title={title}
        className={classes}
        aria-disabled={isDisabled}
        {...props}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      title={title}
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {content}
    </button>
  )
})

Button.displayName = 'Button'

export default Button