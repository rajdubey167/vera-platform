import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '../../components/common/Pagination'

function setup(overrides = {}) {
  const defaults = { page: 1, pages: 5, total: 100, limit: 20, onPage: vi.fn(), onLimit: vi.fn() }
  const props = { ...defaults, ...overrides }
  render(<Pagination {...props} />)
  return props
}

describe('Pagination', () => {
  it('renders page info correctly', () => {
    setup({ page: 2, pages: 5, total: 100, limit: 20 })
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
    expect(screen.getByText(/21–40 of 100/)).toBeInTheDocument()
  })

  it('calls onPage with next page when › clicked', () => {
    const { onPage } = setup({ page: 2, pages: 5 })
    fireEvent.click(screen.getByText('›'))
    expect(onPage).toHaveBeenCalledWith(3)
  })

  it('calls onPage with prev page when ‹ clicked', () => {
    const { onPage } = setup({ page: 3, pages: 5 })
    fireEvent.click(screen.getByText('‹'))
    expect(onPage).toHaveBeenCalledWith(2)
  })

  it('calls onPage(1) when « clicked', () => {
    const { onPage } = setup({ page: 3, pages: 5 })
    fireEvent.click(screen.getByText('«'))
    expect(onPage).toHaveBeenCalledWith(1)
  })

  it('calls onPage(pages) when » clicked', () => {
    const { onPage } = setup({ page: 2, pages: 7 })
    fireEvent.click(screen.getByText('»'))
    expect(onPage).toHaveBeenCalledWith(7)
  })

  it('disables prev buttons on first page', () => {
    setup({ page: 1, pages: 5 })
    expect(screen.getByText('«').closest('button')).toBeDisabled()
    expect(screen.getByText('‹').closest('button')).toBeDisabled()
  })

  it('disables next buttons on last page', () => {
    setup({ page: 5, pages: 5 })
    expect(screen.getByText('›').closest('button')).toBeDisabled()
    expect(screen.getByText('»').closest('button')).toBeDisabled()
  })

  it('calls onLimit when rows-per-page select changes', () => {
    const { onLimit } = setup()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '50' } })
    expect(onLimit).toHaveBeenCalledWith(50)
  })

  it('shows correct range on last partial page', () => {
    setup({ page: 4, pages: 4, total: 70, limit: 20 })
    expect(screen.getByText(/61–70 of 70/)).toBeInTheDocument()
  })

  it('shows 1–1 of 1 for single record', () => {
    setup({ page: 1, pages: 1, total: 1, limit: 20 })
    expect(screen.getByText(/1–1 of 1/)).toBeInTheDocument()
  })

  it('renders limit options 10 20 50 100', () => {
    setup()
    const opts = screen.getAllByRole('option').map((o) => o.textContent)
    expect(opts).toEqual(['10', '20', '50', '100'])
  })
})
