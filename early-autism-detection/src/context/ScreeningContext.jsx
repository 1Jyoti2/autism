import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../lib/constants'
import {
  fetchScreenings,
  createScreening,
  deleteScreening,
  makeScreeningId,
} from '../services/screeningService'
import { computeScreeningResult } from '../services/scoringService'

const ScreeningContext = createContext(null)

function readStoredCurrent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.currentScreening)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStoredCurrent(current) {
  try {
    if (current) {
      localStorage.setItem(STORAGE_KEYS.currentScreening, JSON.stringify(current))
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentScreening)
    }
  } catch {
    // storage unavailable — session stays in memory
  }
}

export function ScreeningProvider({ children }) {
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState('loading')
  const [current, setCurrent] = useState(readStoredCurrent)
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => {
    let active = true
    fetchScreenings()
      .then((items) => {
        if (!active) return
        setHistory(items)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    writeStoredCurrent(current)
  }, [current])

  const startScreening = useCallback(
    (childId) => {
      setCurrent((previous) => {
        if (previous && previous.childId === childId) {
          return previous
        }
        return {
          id: makeScreeningId(),
          childId,
          answers: {},
          startedAt: new Date().toISOString(),
        }
      })
      setLastResult(null)
    },
    [],
  )

  const setAnswer = useCallback((questionId, value) => {
    setCurrent((previous) => {
      if (!previous) return previous
      return {
        ...previous,
        answers: { ...previous.answers, [questionId]: value },
      }
    })
  }, [])

  const cancelScreening = useCallback(() => {
    setCurrent(null)
  }, [])

  const attachEmotionSnapshot = useCallback((emotionImage, emotionResult) => {
    setCurrent((previous) =>
      previous ? { ...previous, emotionImage, emotionResult } : previous,
    )
  }, [])

  const clearEmotionSnapshot = useCallback(() => {
    setCurrent((previous) =>
      previous ? { ...previous, emotionImage: null, emotionResult: null } : previous,
    )
  }, [])

  const submitScreening = useCallback(async () => {
    if (!current) {
      throw new Error('No screening session is in progress.')
    }
    const result = computeScreeningResult({ answers: current.answers })
    const record = {
      id: current.id,
      childId: current.childId,
      date: new Date().toISOString(),
      status: 'completed',
      answers: current.answers,
      emotionImage: current.emotionImage ?? null,
      emotionResult: current.emotionResult ?? null,
      ...result,
    }
    const saved = await createScreening(record)
    setHistory((previous) => [saved, ...previous])
    setCurrent(null)
    setLastResult(saved)
    return saved
  }, [current])

  const saveResult = useCallback(async () => {
    if (!lastResult) return null
    setHistory((previous) =>
      previous.some((record) => record.id === lastResult.id)
        ? previous
        : [lastResult, ...previous],
    )
    return lastResult
  }, [lastResult])

  const removeScreening = useCallback(async (id) => {
    await deleteScreening(id)
    setHistory((previous) => previous.filter((screening) => screening.id !== id))
  }, [])

  const answeredCount = current ? Object.keys(current.answers).length : 0

  const value = useMemo(
    () => ({
      history,
      status,
      current,
      lastResult,
      answeredCount,
      startScreening,
      setAnswer,
      submitScreening,
      saveResult,
      cancelScreening,
      attachEmotionSnapshot,
      clearEmotionSnapshot,
      removeScreening,
    }),
    [
      history,
      status,
      current,
      lastResult,
      answeredCount,
      startScreening,
      setAnswer,
      submitScreening,
      saveResult,
      cancelScreening,
      attachEmotionSnapshot,
      clearEmotionSnapshot,
      removeScreening,
    ],
  )

  return <ScreeningContext.Provider value={value}>{children}</ScreeningContext.Provider>
}

export function useScreenings() {
  const context = useContext(ScreeningContext)
  if (!context) {
    throw new Error('useScreenings must be used within a ScreeningProvider')
  }
  return context
}