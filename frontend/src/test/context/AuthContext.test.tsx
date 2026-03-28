import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import { mockUser } from '../mocks/handlers'

// vi.mock is hoisted — use vi.hoisted() so variables are ready in the factory
const { mockGetMe, mockLogin, mockRegister } = vi.hoisted(() => ({
  mockGetMe: vi.fn(),
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  authService: {
    getMe: mockGetMe,
    login: mockLogin,
    register: mockRegister,
  },
}))

function TestComponent() {
  const { user, isAuthenticated, isAdmin, token, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  return (
    <div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="admin">{String(isAdmin)}</div>
      <div data-testid="email">{user?.email ?? 'none'}</div>
      <div data-testid="token">{token ?? 'none'}</div>
    </div>
  )
}

function renderAuth(children = <TestComponent />) {
  return render(<MemoryRouter><AuthProvider>{children}</AuthProvider></MemoryRouter>)
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetMe.mockResolvedValue(mockUser)
  })

  it('starts unauthenticated when no token in localStorage', async () => {
    mockGetMe.mockResolvedValue(mockUser) // won't be called
    renderAuth()
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(screen.getByTestId('email').textContent).toBe('none')
    expect(mockGetMe).not.toHaveBeenCalled()
  })

  it('fetches user from /me when token exists in localStorage', async () => {
    localStorage.setItem('vera_token', 'valid-token')
    renderAuth()
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(screen.getByTestId('email').textContent).toBe(mockUser.email)
    expect(screen.getByTestId('authenticated').textContent).toBe('true')
  })

  it('clears token when /me throws (e.g. 401)', async () => {
    localStorage.setItem('vera_token', 'bad-token')
    mockGetMe.mockRejectedValueOnce(new Error('Unauthorized'))
    renderAuth()
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(localStorage.getItem('vera_token')).toBeNull()
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
  })

  it('isAdmin is false for regular user', async () => {
    localStorage.setItem('vera_token', 'token')
    renderAuth()
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(screen.getByTestId('admin').textContent).toBe('false')
  })

  it('isAdmin is true for admin user', async () => {
    localStorage.setItem('vera_token', 'admin-token')
    mockGetMe.mockResolvedValueOnce({ ...mockUser, role: 'admin' })
    renderAuth()
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(screen.getByTestId('admin').textContent).toBe('true')
  })

  it('login stores token and user', async () => {
    const tokenResponse = { access_token: 'new-token', token_type: 'bearer', user: mockUser }
    mockLogin.mockResolvedValueOnce(tokenResponse)

    function LoginTest() {
      const { login, user, token } = useAuth()
      return (
        <div>
          <button onClick={() => login('user@test.com', 'Test1234!')}>Login</button>
          <div data-testid="user">{user?.email ?? 'none'}</div>
          <div data-testid="token">{token ?? 'none'}</div>
        </div>
      )
    }
    renderAuth(<LoginTest />)
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    await act(async () => { screen.getByRole('button', { name: 'Login' }).click() })
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('user@test.com'))
    expect(localStorage.getItem('vera_token')).toBe('new-token')
  })

  it('logout clears token from localStorage', async () => {
    localStorage.setItem('vera_token', 'valid-token')
    function LogoutTest() {
      const { logout } = useAuth()
      return <button onClick={logout}>Logout</button>
    }
    renderAuth(<LogoutTest />)
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    await act(async () => { screen.getByRole('button', { name: 'Logout' }).click() })
    expect(localStorage.getItem('vera_token')).toBeNull()
  })

  it('throws error when useAuth used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within AuthProvider')
    spy.mockRestore()
  })
})
