import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../lib/constants'
import { useAuth } from './AuthContext'
import {
  fetchChildren,
  createChild,
  updateChild as updateChildRecord,
  deleteChild,
} from '../services/childService'

const ChildContext = createContext(null)

export function ChildProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [selectedChildId, setSelectedChildId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.selectedChild)
    } catch {
      return null
    }
  })

  const refreshChildren = useCallback(async () => {
    setStatus('loading')
    try {
      const list = await fetchChildren()
      setItems(list)
      setStatus('ready')
      return list
    } catch {
      setStatus('error')
      return []
    }
  }, [])

  // Refetch whenever the authenticated user changes
  useEffect(() => {
    let active = true
    setStatus('loading')
    fetchChildren()
      .then((list) => {
        if (!active) return
        setItems(list)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [user?.id])

  const selectChild = useCallback((id) => {
    setSelectedChildId(id)
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.selectedChild, id)
      } else {
        localStorage.removeItem(STORAGE_KEYS.selectedChild)
      }
    } catch {
      // storage unavailable — selection stays in memory
    }
  }, [])

  // Auto-sync selection with available items
  useEffect(() => {
    if (items.length > 0) {
      if (!selectedChildId || !items.some((c) => c.id === selectedChildId)) {
        selectChild(items[0].id)
      }
    } else {
      selectChild(null)
    }
  }, [items, selectedChildId, selectChild])

  const addChild = useCallback(
    async (input) => {
      const child = await createChild(input)
      setItems((previous) => [...previous.filter((c) => c.id !== child.id), child])
      selectChild(child.id)
      return child
    },
    [selectChild],
  )

  const updateChild = useCallback(async (id, patch) => {
    const updated = await updateChildRecord(id, patch)
    setItems((previous) =>
      previous.map((child) => (child.id === id ? updated : child)),
    )
    return updated
  }, [])

  const removeChild = useCallback(
    async (id) => {
      await deleteChild(id)
      setItems((previous) => previous.filter((child) => child.id !== id))
      if (selectedChildId === id) {
        selectChild(null)
      }
    },
    [selectedChildId, selectChild],
  )

  const selectedChild = useMemo(
    () => items.find((child) => child.id === selectedChildId) ?? null,
    [items, selectedChildId],
  )

  const value = useMemo(
    () => ({
      children: items,
      status,
      selectedChild,
      selectedChildId,
      selectChild,
      addChild,
      updateChild,
      removeChild,
      refreshChildren,
    }),
    [
      items,
      status,
      selectedChild,
      selectedChildId,
      selectChild,
      addChild,
      updateChild,
      removeChild,
      refreshChildren,
    ],
  )

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>
}

export function useChildren() {
  const context = useContext(ChildContext)
  if (!context) {
    throw new Error('useChildren must be used within a ChildProvider')
  }
  return context
}