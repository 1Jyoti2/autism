import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from './Button'
import { ROUTES } from '../../lib/constants'

export default function BackButton({
  fallback = ROUTES.dashboard,
  label = 'Back',
  className = '',
  variant = 'ghost',
  size = 'sm',
  ...props
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = (e) => {
    if (props.onClick) {
      props.onClick(e)
    }
    if (e.defaultPrevented) return

    // Safe history back navigation
    if (typeof window !== 'undefined' && window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
    } else {
      const targetFallback = fallback || (location.pathname.startsWith('/app') || location.pathname.startsWith('/children') || location.pathname.startsWith('/screening') ? ROUTES.dashboard : ROUTES.home)
      navigate(targetFallback, { replace: true })
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${className}`}
      onClick={handleClick}
      aria-label={label}
      {...props}
    >
      <ArrowLeft className="size-4" />
      <span>{label}</span>
    </Button>
  )
}