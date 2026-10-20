import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: IconComponent,
    action,
    className = '',
    id,
    disabled = false,
    ...props
  },
  ref,
) {
  const inputId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint ? `${inputId}-hint` : undefined

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-semibold text-surface-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {IconComponent && (
          <IconComponent className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-surface-400" />
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hintId}
          className={`w-full h-10 rounded-lg border bg-white px-3 text-sm text-surface-900 transition-shadow placeholder:text-surface-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-400 ${
            IconComponent ? 'pl-9' : ''
          } ${
            action ? 'pr-14' : ''
          } ${
            error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-300'
              : 'border-surface-300 focus:border-primary-500 focus:ring-primary-200'
          } ${className}`}
          {...props}
        />
        {action && (
          <div className="absolute top-1/2 right-0 -translate-y-1/2 pr-1.5">
            {action}
          </div>
        )}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-surface-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'

export default Input