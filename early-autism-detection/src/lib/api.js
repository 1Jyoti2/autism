import axios from 'axios'
import { STORAGE_KEYS } from './constants'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.token) || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem(STORAGE_KEYS.token)
      localStorage.removeItem('token')
      localStorage.removeItem(STORAGE_KEYS.user)
    }

    // Format error message from backend detail if present
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      if (typeof detail === 'string') {
        error.message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        error.message = detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient