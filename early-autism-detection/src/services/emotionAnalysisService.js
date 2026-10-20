import apiClient from '../lib/api'

export const EMOTION_OPTIONS = [
  { key: 'joy', label: 'Joy', color: '#f59e0b', description: 'Bright, engaged, and happy expressions.' },
  { key: 'sadness', label: 'Sadness', color: '#3b82f6', description: 'Withdrawn, low, or tearful cues.' },
  { key: 'anger', label: 'Anger', color: '#ef4444', description: 'Frustrated, tense, or intense responses.' },
  { key: 'fear', label: 'Fear', color: '#8b5cf6', description: 'Wary, startled, or anxious expressions.' },
  { key: 'surprise', label: 'Surprise', color: '#ec4899', description: 'Sudden reactions to unexpected moments.' },
  { key: 'natural', label: 'Natural', color: '#0d9488', description: 'Calm, neutral, and relaxed expressions.' },
]

export function getEmotionMeta(key) {
  return EMOTION_OPTIONS.find((e) => e.key.toLowerCase() === (key || '').toLowerCase()) ?? EMOTION_OPTIONS[5]
}

export const FACIAL_FEATURE_OPTIONS = [
  {
    key: 'atypical_engagement',
    label: 'Atypical Facial Engagement',
    color: '#e11d48',
    description: 'Facial attention patterns and eye contact alignment characteristic of autism screening markers.',
  },
  {
    key: 'neutral_response',
    label: 'Typical Facial Cues',
    color: '#059669',
    description: 'Standard facial expression engagement and eye alignment.',
  },
]

/**
 * Connected frontend service for AI Facial Emotion Recognition.
 * Sends real image file to backend PyTorch model endpoint POST /api/analyze-image.
 */
export async function analyzeEmotionImage(imageFile, childName = 'Selected Child', childId = null) {
  const formData = new FormData()
  formData.append('file', imageFile)
  formData.append('child_name', childName)
  if (childId) {
    formData.append('child_id', childId)
  }

  try {
    const response = await apiClient.post('/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail)
      throw new Error(msg)
    }
    throw error
  }
}