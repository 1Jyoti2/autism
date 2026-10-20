import apiClient from '../lib/api'

export const BEHAVIOR_OPTIONS = [
  {
    key: 'arm_flapping',
    label: 'Arm Flapping',
    color: '#0284c7',
    description: 'Repetitive rapid movement of arms or hands up and down or side to side.',
  },
  {
    key: 'head_banging',
    label: 'Head Banging',
    color: '#e11d48',
    description: 'Repetitive movement of the head against surfaces or back and forth.',
  },
  {
    key: 'spinning',
    label: 'Spinning',
    color: '#7c3aed',
    description: 'Continuous repetitive body spinning or turning in circles.',
  },
]

export function getBehaviorMeta(key) {
  return BEHAVIOR_OPTIONS.find((behavior) => behavior.key.toLowerCase() === (key || '').toLowerCase()) ?? BEHAVIOR_OPTIONS[0]
}

/**
 * Connected frontend service for Video Stimming Action Recognition.
 * Sends real video file to backend PyTorch model endpoint POST /api/analyze-video.
 */
export async function analyzeVideo(videoFile, childName = 'Selected Child', childId = null) {
  const formData = new FormData()
  formData.append('file', videoFile)
  formData.append('child_name', childName)
  if (childId) {
    formData.append('child_id', childId)
  }

  try {
    const response = await apiClient.post('/analyze-video', formData, {
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
