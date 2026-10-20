import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  open,
  onClose,
  title,
  description,
  ariaLabel,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
  lockScroll = true,
  panelClassName = '',
  className = '',
}) {
  const panelRef = useRef(null)
  const previouslyFocusedRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open || !lockScroll) return undefined
    const originalOverflow = document.body.style.overflow
    const originalPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPadding
    }
  }, [open, lockScroll])

  useEffect(() => {
    if (!open) return undefined

    previouslyFocusedRef.current = document.activeElement
    const panel = panelRef.current

    const focusPanel = () => {
      if (!panel) return
      const focusables = panel.querySelectorAll(FOCUSABLE_SELECTOR)
      if (focusables.length > 0) {
        focusables[0].focus()
      } else {
        panel.focus()
      }
    }

    const frame = requestAnimationFrame(focusPanel)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const focusables = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open])

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      closeRef.current?.()
    }
  }

  const sizes = SIZES[size] ?? SIZES.md

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 ${className}`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-surface-900/60 backdrop-blur-[2px]"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={title && !ariaLabel ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-modal outline-none sm:rounded-2xl ${sizes} ${panelClassName}`}
          >
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 pt-5 pb-4">
                <div className="min-w-0">
                  {title && (
                    <h2
                      id={titleId}
                      className="font-display text-lg font-bold text-surface-900"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id={descriptionId}
                      className="mt-1 text-sm text-surface-500"
                    >
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="shrink-0 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer && (
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-border bg-surface-50/50 px-6 py-4 sm:flex-row">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}