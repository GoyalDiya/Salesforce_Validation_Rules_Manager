import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    axios
      .get('/api/me', { withCredentials: true })
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
    window.location.href = '/auth/login'
  }

  const logout = async () => {
    try {
      await axios.post('/auth/logout', null, { withCredentials: true })
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
