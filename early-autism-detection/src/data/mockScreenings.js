import { screeningQuestions } from './screeningQuestions'
import { computeScreeningResult } from '../services/scoringService'

const PAST_SESSIONS = [
  {
    id: 'scr_1001',
    childId: 'ch_liam',
    date: '2026-06-09T09:30:00.000Z',
    intensity: {
      socialInteraction: 2.1,
      communication: 2.4,
      repetitiveBehavior: 2.3,
      sensory: 1.6,
    },
  },
  {
    id: 'scr_1002',
    childId: 'ch_maya',
    date: '2026-04-24T14:05:00.000Z',
    intensity: {
      socialInteraction: 0.7,
      communication: 1.1,
      repetitiveBehavior: 0.8,
      sensory: 0.6,
    },
  },
  {
    id: 'scr_1003',
    childId: 'ch_liam',
    date: '2026-03-02T11:20:00.000Z',
    intensity: {
      socialInteraction: 1.9,
      communication: 2.2,
      repetitiveBehavior: 2.5,
      sensory: 1.3,
    },
  },
  {
    id: 'scr_1004',
    childId: 'ch_sofia',
    date: '2026-05-30T10:45:00.000Z',
    intensity: {
      socialInteraction: 0.5,
      communication: 0.9,
      repetitiveBehavior: 0.4,
      sensory: 1.4,
    },
  },
]

function hashNumber(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return (hash % 1000) / 1000
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function buildRecord(session) {
  const answers = {}
  for (const question of screeningQuestions) {
    const base = session.intensity[question.domain] ?? 1
    const spread = hashNumber(`${session.id}${question.id}`) * 0.6 - 0.3
    answers[question.id] = clamp(Math.round(base + spread), 0, 3)
  }

  const result = computeScreeningResult({ answers })
  return {
    id: session.id,
    childId: session.childId,
    date: session.date,
    status: 'completed',
    answers,
    ...result,
  }
}

export const mockScreenings = PAST_SESSIONS.map(buildRecord).sort(
  (a, b) => new Date(b.date) - new Date(a.date),
)