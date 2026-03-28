import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../../hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('does not update value before delay elapses', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'initial' },
    })
    rerender({ v: 'changed' })
    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('initial')
  })

  it('updates value after delay elapses', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'initial' },
    })
    rerender({ v: 'changed' })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('changed')
  })

  it('only fires once for rapid successive changes', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'b' })
    act(() => vi.advanceTimersByTime(100))
    rerender({ v: 'c' })
    act(() => vi.advanceTimersByTime(100))
    rerender({ v: 'final' })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('final')
  })

  it('uses default delay of 400ms when not specified', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v), {
      initialProps: { v: 'start' },
    })
    rerender({ v: 'end' })
    act(() => vi.advanceTimersByTime(399))
    expect(result.current).toBe('start')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('end')
  })

  it('works with number type', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 200), {
      initialProps: { v: 0 },
    })
    rerender({ v: 42 })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe(42)
  })

  it('works with object type', () => {
    const obj1 = { page: 1 }
    const obj2 = { page: 2 }
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 200), {
      initialProps: { v: obj1 },
    })
    rerender({ v: obj2 })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toEqual({ page: 2 })
  })
})
