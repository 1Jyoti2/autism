import apiClient from '../lib/api'
import { STORAGE_KEYS } from '../lib/constants'
import { normalizeRole, ROLES } from '../lib/roles'

function deriveRoleFromEmail(email = '') {
  const lower = email.toLowerCase()
  if (lower.includes('doctor') || lower.includes('doc') || lower.includes('md')) return ROLES.DOCTOR
  if (lower.includes('caretaker') || lower.includes('nurse') || lower.includes('staff')) return ROLES.CARETAKER
  if (lower.includes('admin')) return ROLES.ADMIN
  return ROLES.PARENT
}

function deriveName(email) {
  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    if (!raw) return null
    const user = JSON.parse(raw)
    return {
      ...user,
      role: normalizeRole(user.role),
    }
  } catch {
    return null
  }
}

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.token) || localStorage.getItem('token')
}

export function storeSession({ token, user }) {
  const normUser = {
    ...user,
    role: normalizeRole(user.role),
  }
  const effectiveToken = token || 'session-token'
  localStorage.setItem(STORAGE_KEYS.token, effectiveToken)
  localStorage.setItem('token', effectiveToken)
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(normUser))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.token)
  localStorage.removeItem('token')
  localStorage.removeItem(STORAGE_KEYS.user)
}

export async function requestLogin({ email, password }) {
  if (!email || !password) {
    throw new Error('Please enter your email and password.')
  }

  try {
    const response = await apiClient.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    })

    const { token, access_token, user } = response.data || {}
    const rawRole = user?.role || response.data?.role || deriveRoleFromEmail(email)

    const sessionUser = {
      id: user?.id || `usr_${Date.now()}`,
      name: user?.name || user?.full_name || user?.fullName || deriveName(email),
      email: email.trim().toLowerCase(),
      role: normalizeRole(rawRole),
    }

    const sessionToken = token || access_token || 'bearer-token'
    storeSession({ token: sessionToken, user: sessionUser })

    return {
      token: sessionToken,
      user: sessionUser,
    }
  } catch (error) {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail)
      throw new Error(msg)
    }
    throw error
  }
}

export async function requestRegister({ fullName, email, password, role = 'parent' }) {
  try {
    const response = await apiClient.post('/auth/register', {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password || 'Password123!',
      role: normalizeRole(role),
    })

    const { token, access_token, user } = response.data || {}
    const sessionUser = {
      id: user?.id || `usr_${Date.now()}`,
      name: user?.name || user?.full_name || user?.fullName || fullName.trim(),
      email: email.trim().toLowerCase(),
      role: normalizeRole(user?.role || role),
    }

    const sessionToken = token || access_token || `token_${Date.now()}`
    storeSession({ token: sessionToken, user: sessionUser })

    return {
      token: sessionToken,
      user: sessionUser,
    }
  } catch (error) {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail)
      throw new Error(msg)
    }
    throw error
  }
}

export async function fetchCurrentUser() {
  try {
    const res = await apiClient.get('/auth/me')
    return res.data
  } catch {
    return getStoredUser()
  }
}

export async function requestForgotPassword(email) {
  if (!email || !email.trim()) {
    throw new Error('Please enter your email address.')
  }

  try {
    const response = await apiClient.post('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
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

export async function requestResetPassword({ email, token, newPassword, confirmPassword }) {
  if (!email || !newPassword) {
    throw new Error('Please enter your email and new password.')
  }
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long.')
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    throw new Error('Passwords do not match.')
  }

  try {
    const payload = {
      email: email.trim().toLowerCase(),
      newPassword,
      new_password: newPassword,
      confirmPassword,
    }
    if (token && token.trim()) {
      payload.token = token.trim()
    }
    const response = await apiClient.post('/auth/reset-password', payload)
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