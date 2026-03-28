/**
 * Custom render that wraps components with all required providers:
 * React Router, AuthContext (pre-logged-in by default), ThemeContext.
 */
import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import type { User } from '../../types'

// Minimal stub contexts so we don't need real API calls in unit tests
interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, full_name: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export const mockUser: User = {
  id: 1,
  email: 'user@test.com',
  full_name: 'Test User',
  role: 'user',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockAdmin: User = {
  ...mockUser,
  id: 2,
  email: 'admin@test.com',
  full_name: 'Admin User',
  role: 'admin',
}

interface WrapperOptions {
  user?: User | null
  initialPath?: string
  isAuthenticated?: boolean
}

export function createWrapper(opts: WrapperOptions = {}) {
  const { user = mockUser, initialPath = '/' } = opts
  const isAuthenticated = opts.isAuthenticated ?? user !== null

  const authValue: AuthContextValue = {
    user,
    token: user ? 'fake-jwt-token' : null,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    login: vi.fn().mockResolvedValue(undefined),
    signup: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    loading: false,
  }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthContext.Provider value={authValue}>
          <Toaster />
          {children}
        </AuthContext.Provider>
      </MemoryRouter>
    )
  }
}

export function renderWithProviders(
  ui: React.ReactElement,
  opts: WrapperOptions & RenderOptions = {}
) {
  const { user, initialPath, isAuthenticated, ...renderOpts } = opts
  const Wrapper = createWrapper({ user, initialPath, isAuthenticated })
  return render(ui, { wrapper: Wrapper, ...renderOpts })
}

// Re-export everything from RTL for convenience
export * from '@testing-library/react'
export { renderWithProviders as render }
