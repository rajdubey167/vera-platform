import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DatasetCard from '../../components/datasets/DatasetCard'
import type { Dataset } from '../../types'

const baseDataset: Dataset = {
  id: 42,
  filename: 'sales.csv',
  file_type: 'csv',
  upload_time: '2024-06-15T12:00:00Z',
  record_count: 1500,
  file_size: 102400,
  user_id: 1,
  status: 'ready',
}

function renderCard(dataset = baseDataset, onDelete = vi.fn()) {
  return render(
    <MemoryRouter>
      <DatasetCard dataset={dataset} onDelete={onDelete} />
    </MemoryRouter>
  )
}

describe('DatasetCard', () => {
  it('renders filename', () => {
    renderCard()
    expect(screen.getByText('sales.csv')).toBeInTheDocument()
  })

  it('renders file type badge', () => {
    renderCard()
    expect(screen.getByText('csv')).toBeInTheDocument()
  })

  it('renders JSON file type badge for json dataset', () => {
    renderCard({ ...baseDataset, file_type: 'json', filename: 'data.json' })
    expect(screen.getByText('json')).toBeInTheDocument()
  })

  it('renders record count formatted', () => {
    renderCard()
    expect(screen.getByText('1,500')).toBeInTheDocument()
  })

  it('renders file size in KB', () => {
    renderCard({ ...baseDataset, file_size: 2048 })
    expect(screen.getByText('2.0 KB')).toBeInTheDocument()
  })

  it('renders file size in MB', () => {
    renderCard({ ...baseDataset, file_size: 2 * 1024 * 1024 })
    expect(screen.getByText('2.0 MB')).toBeInTheDocument()
  })

  it('renders file size in bytes when < 1KB', () => {
    renderCard({ ...baseDataset, file_size: 512 })
    expect(screen.getByText('512 B')).toBeInTheDocument()
  })

  it('shows ready status badge', () => {
    renderCard()
    expect(screen.getByText('ready')).toBeInTheDocument()
  })

  it('shows non-ready status badge', () => {
    renderCard({ ...baseDataset, status: 'processing' })
    expect(screen.getByText('processing')).toBeInTheDocument()
  })

  it('View link points to /datasets/:id', () => {
    renderCard()
    expect(screen.getByText('View').closest('a')).toHaveAttribute('href', '/datasets/42')
  })

  it('Analyze link points to /analytics/:id', () => {
    renderCard()
    expect(screen.getByText('Analyze').closest('a')).toHaveAttribute('href', '/analytics/42')
  })

  it('calls onDelete with dataset id when Delete button clicked', () => {
    const onDelete = vi.fn()
    renderCard(baseDataset, onDelete)
    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledWith(42)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('renders dataset id', () => {
    renderCard()
    expect(screen.getByText('#42')).toBeInTheDocument()
  })
})
