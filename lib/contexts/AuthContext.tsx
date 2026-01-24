'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isLoggedIn: boolean
  login: (email: string, password: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check localStorage on mount
    const stored = localStorage.getItem('codebuddy_auth')
    if (stored === 'true') {
      setIsLoggedIn(true)
    }
  }, [])

  const login = (email: string, password: string) => {
    // Fake auth - accept any input
    setIsLoggedIn(true)
    localStorage.setItem('codebuddy_auth', 'true')
  }

  const logout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('codebuddy_auth')
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
