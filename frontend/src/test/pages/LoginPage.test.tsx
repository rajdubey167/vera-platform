import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// vi.mock is hoisted — use vi.hoisted() so variables are available in the factory
const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({
  default: { error: toastError, success: toastSuccess },
  Toaster: () => null,
  toast: { error: toastError, success: toastSuccess },
}))

// Mock useAuth hook
const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    token: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: false,
    signup: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import LoginPage from '../../pages/LoginPage'

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogin.mockResolvedValue(undefined)
  })

  it('renders email and password inputs', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders VERA heading', () => {
    renderLogin()
    expect(screen.getByText('VERA')).toBeInTheDocument()
  })

  it('renders Sign In button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('renders link to signup page', () => {
    renderLogin()
    expect(screen.getByText('Create one').closest('a')).toHaveAttribute('href', '/signup')
  })

  it('updates email field on input', async () => {
    renderLogin()
    const emailInput = screen.getByPlaceholderText('you@example.com')
    await userEvent.type(emailInput, 'test@example.com')
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('updates password field on input', async () => {
    renderLogin()
    const pwInput = screen.getByPlaceholderText('••••••••')
    await userEvent.type(pwInput, 'mypassword')
    expect(pwInput).toHaveValue('mypassword')
  })

  it('calls login with email and password on submit', async () => {
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Test1234!')
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!)
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'Test1234!')
    )
  })

  it('navigates to /dashboard on successful login', async () => {
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Test1234!')
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows error toast on failed login', async () => {
    mockLogin.mockRejectedValueOnce({ response: { data: { detail: 'Invalid credentials' } } })
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bad@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!)
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Invalid credentials'))
  })

  it('shows generic error when detail is missing', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'))
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass')
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!)
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Login failed'))
  })

  it('disables button and shows loading text while signing in', async () => {
    let resolve: () => void
    mockLogin.mockImplementation(() => new Promise((r) => { resolve = r }))
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Test1234!')
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!)
    await waitFor(() => expect(screen.getByText('Signing in...')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
    resolve!()
  })

  it('password field has type=password (not visible)', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password')
  })

  it('email field has type=email', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('you@example.com')).toHaveAttribute('type', 'email')
  })
})
