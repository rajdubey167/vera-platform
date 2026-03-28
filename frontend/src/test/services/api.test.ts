import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import api from '../../services/api'

// axios-mock-adapter intercepts at the adapter level — works perfectly in jsdom
const mock = new MockAdapter(api)

describe('api (axios instance)', () => {
  beforeEach(() => {
    localStorage.clear()
    mock.reset()
  })

  afterEach(() => {
    mock.reset()
  })

  it('makes GET request to the base URL', async () => {
    mock.onGet('/ping').reply(200, { ok: true })
    const res = await api.get('/ping')
    expect(res.data).toEqual({ ok: true })
  })

  it('attaches Authorization header when token is in localStorage', async () => {
    localStorage.setItem('vera_token', 'my-test-token')
    let capturedAuth = ''
    mock.onGet('/me').reply((config) => {
      capturedAuth = config.headers?.Authorization ?? ''
      return [200, { id: 1 }]
    })
    await api.get('/me')
    expect(capturedAuth).toBe('Bearer my-test-token')
  })

  it('does not attach Authorization header when no token', async () => {
    let capturedAuth: string | undefined = 'present'
    mock.onGet('/me').reply((config) => {
      capturedAuth = config.headers?.Authorization
      return [200, { id: 1 }]
    })
    await api.get('/me')
    expect(capturedAuth).toBeUndefined()
  })

  it('sends JSON content-type by default', async () => {
    let capturedContentType = ''
    mock.onPost('/login').reply((config) => {
      capturedContentType = config.headers?.['Content-Type'] ?? ''
      return [200, { access_token: 'tok' }]
    })
    await api.post('/login', { email: 'a@b.com', password: 'pass' })
    expect(capturedContentType).toContain('application/json')
  })

  it('clears token from localStorage on 401 response', async () => {
    localStorage.setItem('vera_token', 'expired-token')
    mock.onGet('/protected').reply(401)
    try {
      await api.get('/protected')
    } catch {
      // Expected — interceptor throws after clearing token
    }
    expect(localStorage.getItem('vera_token')).toBeNull()
  })

  it('does not clear token on non-401 errors', async () => {
    localStorage.setItem('vera_token', 'valid-token')
    mock.onGet('/notfound').reply(404)
    try {
      await api.get('/notfound')
    } catch {
      // Expected
    }
    expect(localStorage.getItem('vera_token')).toBe('valid-token')
  })

  it('passes through 200 responses normally', async () => {
    mock.onGet('/datasets').reply(200, { items: [], total: 0, page: 1, pages: 0, limit: 20 })
    const res = await api.get('/datasets')
    expect(res.status).toBe(200)
    expect(res.data.total).toBe(0)
  })
})
