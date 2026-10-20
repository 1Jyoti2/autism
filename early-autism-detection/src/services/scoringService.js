import { screeningQuestions as defaultQuestions } from '../data/screeningQuestions'

export const RISK_THRESHOLDS = {
  elevated: 0.35,
  high: 0.65,
}

export const RISK_LEVELS = ['low', 'elevated', 'high']

const DOMAIN_RECOMMENDATIONS = {
  communication: 'A speech and language evaluation can help support communication development.',
  socialInteraction: 'Structured play groups or social-skills support could help with social engagement.',
  repetitiveBehavior: 'Occupational or behavioral support may help with repetitive routines and flexibility.',
  sensory: 'An occupational therapy assessment can help with sensory sensitivities and everyday comfort.',
}

const GENERAL_RECOMMENDATIONS = {
  low: [
    'Continue monitoring typical developmental milestones.',
    'Re-screen in a few months to track any changes.',
  ],
  elevated: [
    'Discuss your observations with your pediatrician.',
    'Track specific behaviors over the next few weeks.',
  ],
  high: [
    'Seek a formal developmental evaluation from a qualified professional.',
    'Reach out to an early intervention program for timely support.',
  ],
}

export function computeScreeningResult({ answers = {}, questions = defaultQuestions } = {}) {
  const domains = [...new Set(questions.map((question) => question.domain))]
  const maxScore = questions.length * 3

  const domainScores = {}
  let totalScore = 0

  for (const domain of domains) {
    let sum = 0
    for (const question of questions) {
      if (question.domain === domain) {
        sum += answers[question.id] ?? 0
      }
    }
    domainScores[domain] = sum
    totalScore += sum
  }

  const ratio = maxScore > 0 ? totalScore / maxScore : 0
  const likelihood =
    ratio < RISK_THRESHOLDS.elevated
      ? RISK_LEVELS[0]
      : ratio < RISK_THRESHOLDS.high
        ? RISK_LEVELS[1]
        : RISK_LEVELS[2]

  return {
    domainScores,
    totalScore,
    maxScore,
    probability: Math.min(99, Math.max(1, Math.round(ratio * 100))),
    likelihood,
    recommendations: computeRecommendations({ domainScores, likelihood }),
  }
}

export function computeRecommendations({ domainScores = {}, likelihood = 'low' }) {
  const general = GENERAL_RECOMMENDATIONS[likelihood] ?? GENERAL_RECOMMENDATIONS.low
  const entries = Object.entries(domainScores).sort((a, b) => b[1] - a[1])
  const topDomain = entries.length > 0 ? entries[0][0] : null

  const list = [...general]
  if (topDomain && likelihood !== 'low' && list.indexOf(DOMAIN_RECOMMENDATIONS[topDomain] ?? '') === -1) {
    list.push(DOMAIN_RECOMMENDATIONS[topDomain])
  }
  return list
}

export function riskLabel(likelihood) {
  return (
    {
      low: 'Low concern',
      elevated: 'Elevated concern',
      high: 'High concern',
    }[likelihood] ?? likelihood
  )
}

export function riskLevelLabel(likelihood) {
  return (
    {
      low: 'Low Risk',
      elevated: 'Medium Risk',
      high: 'High Risk',
    }[likelihood] ?? likelihood
  )
}

export function riskBadgeVariant(likelihood) {
  return (
    {
      low: 'success',
      elevated: 'warning',
      high: 'danger',
    }[likelihood] ?? 'neutral'
  )
}

export function riskColor(likelihood) {
  return (
    {
      low: '#16a34a',
      elevated: '#d97706',
      high: '#dc2626',
    }[likelihood] ?? '#64748b'
  )
}