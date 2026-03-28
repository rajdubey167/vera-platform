import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './mocks/server'

// jsdom doesn't implement matchMedia — react-hot-toast needs it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// suppress window.location.href navigation in jsdom
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '', assign: vi.fn(), replace: vi.fn() },
})

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers after each test (no test pollution)
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})

// Stop server after all tests
afterAll(() => server.close())
