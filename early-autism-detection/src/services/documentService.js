import apiClient from '../lib/api'

/**
 * Upload and parse a hospital evaluation, clinical report, or referral document.
 * Returns parsed text and extracted child entities for user confirmation.
 */
export async function parseHospitalDocument(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/documents/parse-hospital-doc', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
