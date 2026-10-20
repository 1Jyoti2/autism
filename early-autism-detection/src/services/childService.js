import apiClient from '../lib/api'
import { STORAGE_KEYS } from '../lib/constants'

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.children)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStore(items) {
  try {
    if (Array.isArray(items)) {
      localStorage.setItem(STORAGE_KEYS.children, JSON.stringify(items))
    }
  } catch {
    // ignore storage write errors
  }
}

/**
 * Fetch real children profiles registered for the current user from backend.
 * Never injects dummy/mock children.
 */
export async function fetchChildren() {
  try {
    const res = await apiClient.get('/children')
    if (Array.isArray(res.data)) {
      writeStore(res.data)
      return res.data
    }
  } catch (error) {
    console.warn('Backend children fetch error:', error.message)
    const stored = readStore()
    if (Array.isArray(stored)) {
      return stored
    }
  }
  return []
}

/**
 * Create a new child profile associated with the authenticated parent.
 */
export async function createChild(input) {
  const res = await apiClient.post('/children', input)
  if (res.data) {
    const existing = readStore() || []
    const next = [...existing.filter((c) => c.id !== res.data.id), res.data]
    writeStore(next)
    return res.data
  }
  throw new Error('Failed to create child profile.')
}

/**
 * Update an existing child profile.
 */
export async function updateChild(id, patch) {
  const res = await apiClient.put(`/children/${id}`, patch)
  if (res.data) {
    const existing = readStore() || []
    const next = existing.map((c) => (c.id === id ? res.data : c))
    writeStore(next)
    return res.data
  }
  throw new Error('Failed to update child profile.')
}

/**
 * Delete a child profile.
 */
export async function deleteChild(id) {
  await apiClient.delete(`/children/${id}`)
  const existing = readStore() || []
  const next = existing.filter((c) => c.id !== id)
  writeStore(next)
  return next
}