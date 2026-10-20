import apiClient from '../lib/api'
import { STORAGE_KEYS } from '../lib/constants'
import { mockScreenings } from '../data/mockScreenings'
import { uid } from '../lib/utils'

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.screenings)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStore(items) {
  try {
    localStorage.setItem(STORAGE_KEYS.screenings, JSON.stringify(items))
  } catch {
    // ignore
  }
}

function ensureStore() {
  const stored = readStore()
  if (Array.isArray(stored) && stored.length > 0) {
    return stored
  }
  writeStore(mockScreenings)
  return mockScreenings
}

export async function fetchScreenings() {
  try {
    const res = await apiClient.get('/screenings')
    if (Array.isArray(res.data) && res.data.length > 0) {
      writeStore(res.data)
      return res.data
    }
  } catch (error) {
    console.warn('Backend screenings fetch fallback to local cache:', error.message)
  }
  return ensureStore()
}

export async function fetchPredictionHistory(params = {}) {
  try {
    const res = await apiClient.get('/predictions', { params })
    return res.data
  } catch (error) {
    console.warn('Backend prediction history fetch error:', error.message)
    return { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1, hasMore: false }
  }
}

export async function createScreening(record) {
  try {
    const res = await apiClient.post('/screenings', record)
    if (res.data) {
      const next = [res.data, ...ensureStore().filter((s) => s.id !== res.data.id)]
      writeStore(next)
      return res.data
    }
  } catch (error) {
    console.warn('Backend create screening fallback:', error.message)
  }

  const next = [record, ...ensureStore()]
  writeStore(next)
  return record
}

export async function deleteScreening(id) {
  try {
    await apiClient.delete(`/screenings/${id}`)
  } catch {
    try {
      await apiClient.delete(`/predictions/${id}`)
    } catch {
      // ignore
    }
  }
  const next = ensureStore().filter((screening) => screening.id !== id)
  writeStore(next)
  return next
}

export function makeScreeningId() {
  return uid('scr')
}