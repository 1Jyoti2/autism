/**
 * Password strength calculation and validation rules.
 */

export const PASSWORD_REQUIREMENTS = [
  {
    id: 'length',
    text: 'At least 8 characters',
    test: (value) => Boolean(value && value.length >= 8),
  },
  {
    id: 'uppercase',
    text: 'One uppercase letter',
    test: (value) => Boolean(value && /[A-Z]/.test(value)),
  },
  {
    id: 'lowercase',
    text: 'One lowercase letter',
    test: (value) => Boolean(value && /[a-z]/.test(value)),
  },
  {
    id: 'number',
    text: 'One number',
    test: (value) => Boolean(value && /[0-9]/.test(value)),
  },
]

export const STRENGTH_LEVELS = {
  NONE: {
    key: 'none',
    label: '',
    segments: 0,
    color: 'bg-surface-200',
    score: 0,
  },
  WEAK: {
    key: 'weak',
    label: 'Weak',
    segments: 1,
    color: 'bg-danger-500',
    score: 25,
  },
  MEDIUM: {
    key: 'medium',
    label: 'Medium',
    segments: 2,
    color: 'bg-warning-500',
    score: 50,
  },
  STRONG: {
    key: 'strong',
    label: 'Strong',
    segments: 3,
    color: 'bg-secondary-500',
    score: 75,
  },
  VERY_STRONG: {
    key: 'very-strong',
    label: 'Very strong',
    segments: 4,
    color: 'bg-success-500',
    score: 100,
  },
}

/**
 * Calculates password strength metrics based on length and character diversity.
 * Returns score, segment count (0-4), strength level, and requirement status.
 *
 * @param {string} password
 * @returns {{
 *   score: number,
 *   segments: number,
 *   tier: string,
 *   label: string,
 *   color: string,
 *   requirements: Array<{ id: string, text: string, met: boolean }>
 * }}
 */
export function calculatePasswordStrength(password) {
  const pwd = typeof password === 'string' ? password : ''

  const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
    id: req.id,
    text: req.text,
    met: req.test(pwd),
  }))

  if (!pwd || pwd.length === 0) {
    return {
      ...STRENGTH_LEVELS.NONE,
      tier: STRENGTH_LEVELS.NONE.key,
      requirements,
    }
  }

  const hasLength8 = pwd.length >= 8
  const hasLength12 = pwd.length >= 12
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd)

  // Number of different character categories
  const typesCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

  // All 4 required criteria are met
  const meetsAllRequired = hasLength8 && hasUpper && hasLower && hasNumber

  let level = STRENGTH_LEVELS.WEAK

  if (meetsAllRequired) {
    if (hasSpecial || hasLength12) {
      level = STRENGTH_LEVELS.VERY_STRONG
    } else {
      level = STRENGTH_LEVELS.STRONG
    }
  } else if (hasLength8 && typesCount >= 2) {
    level = STRENGTH_LEVELS.MEDIUM
  } else {
    level = STRENGTH_LEVELS.WEAK
  }

  return {
    score: level.score,
    segments: level.segments,
    tier: level.key,
    label: level.label,
    color: level.color,
    requirements,
  }
}
