import { CheckCircle2 } from 'lucide-react'
import { calculatePasswordStrength } from '../../lib/passwordStrength'

/**
 * Reusable Password Strength Indicator component.
 * Displays 4 progressive colored segments and strength label ('Weak', 'Medium', 'Strong', 'Very strong'),
 * followed by an optional real-time checklist of password requirements.
 */
export default function PasswordStrengthIndicator({
  password = '',
  showRequirements = true,
  className = '',
}) {
  const strength = calculatePasswordStrength(password)

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center gap-1.5" aria-live="polite">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            data-testid={`strength-bar-${segment}`}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              segment <= strength.segments ? strength.color : 'bg-surface-200'
            }`}
            aria-hidden="true"
          />
        ))}
        <span
          data-testid="strength-label"
          className="ml-2 min-w-[4.5rem] text-right text-xs font-semibold text-surface-500 whitespace-nowrap"
        >
          {strength.label}
        </span>
      </div>

      {showRequirements && Boolean(password) && (
        <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {strength.requirements.map((requirement) => (
            <li
              key={requirement.text}
              data-testid={`req-${requirement.id}`}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                requirement.met ? 'text-success-600' : 'text-surface-400'
              }`}
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              {requirement.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
