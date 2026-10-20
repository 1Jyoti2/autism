import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  getStoredUser,
  requestLogin,
  requestRegister,
  storeSession,
  clearSession,
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [status, setStatus] = useState(() =>
    getStoredUser() ? 'authenticated' : 'unauthenticated',
  )

  const login = useCallback(async (credentials) => {
    setStatus('loading')
    try {
      const session = await requestLogin(credentials)
      storeSession(session)
      setUser(session.user)
      setStatus('authenticated')
      return session.user
    } catch (error) {
      setStatus('unauthenticated')
      throw error
    }
  }, [])

  const register = useCallback(async (data) => {
    setStatus('loading')
    try {
      const session = await requestRegister(data)
      storeSession(session)
      setUser(session.user)
      setStatus('authenticated')
      return session.user
    } catch (error) {
      setStatus('unauthenticated')
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      status,
      login,
      register,
      logout,
    }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}