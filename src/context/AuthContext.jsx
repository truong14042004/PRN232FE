import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { authService } from '../services/authService'
import { tokenStore, setForcedLogoutHandler } from '../lib/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const applyAuth = useCallback((auth) => {
    tokenStore.set({ accessToken: auth.accessToken, refreshToken: auth.refreshToken })
    setUser(auth.user)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefresh()
    if (refreshToken) {
      try {
        await authService.logout(refreshToken)
      } catch {
        // ignore network errors on logout
      }
    }
    tokenStore.clear()
    setUser(null)
  }, [])

  // Register forced-logout handler so the axios interceptor can clear state
  useEffect(() => {
    setForcedLogoutHandler(() => {
      tokenStore.clear()
      setUser(null)
    })
  }, [])

  // Bootstrap: if we have a token, fetch the current user
  useEffect(() => {
    let active = true
    const bootstrap = async () => {
      if (!tokenStore.getAccess()) {
        setLoading(false)
        return
      }
      try {
        const me = await authService.me()
        if (active) setUser(me)
      } catch {
        if (active) {
          tokenStore.clear()
          setUser(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(
    async (payload) => {
      const auth = await authService.login(payload)
      applyAuth(auth)
      return auth
    },
    [applyAuth],
  )

  const register = useCallback(
    async (payload) => {
      const auth = await authService.register(payload)
      applyAuth(auth)
      return auth
    },
    [applyAuth],
  )

  const hasRole = useCallback(
    (...roles) => {
      if (!user?.roles?.length) return false
      return roles.some((r) => user.roles.includes(r))
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      hasRole,
      refreshUser: async () => {
        const me = await authService.me()
        setUser(me)
        return me
      },
    }),
    [user, loading, login, register, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
