import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { AuthContext } from './useAuth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get('/api/me')
      .then((res) => {
        if (!cancelled) setUser(res.data?.user ?? null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = () => {
    // Top-level browser navigation — must hit the backend directly.
    // In dev the Vite proxy forwards /auth/* to localhost:3000.
    // In prod VITE_API_BASE_URL prepends the deployed backend origin.
    window.location.href = `${API_BASE}/auth/login`
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // ignore — clearing local state regardless
    }
    setUser(null)
  }

  const value = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
