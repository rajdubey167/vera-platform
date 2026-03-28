import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types'
import { authService } from '../services/authService'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, full_name: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('vera_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('vera_token')
    if (stored) {
      authService
        .getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('vera_token')
          localStorage.removeItem('vera_user')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password)
    localStorage.setItem('vera_token', response.access_token)
    setToken(response.access_token)
    setUser(response.user)
  }

  const signup = async (email: string, password: string, full_name: string) => {
    await authService.register(email, password, full_name)
  }

  const logout = () => {
    localStorage.removeItem('vera_token')
    localStorage.removeItem('vera_user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
