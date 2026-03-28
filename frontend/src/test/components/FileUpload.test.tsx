import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FileUpload from '../../components/upload/FileUpload'

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({
  default: { error: toastError, success: toastSuccess },
  Toaster: () => null,
  toast: { error: toastError, success: toastSuccess },
}))

// Mock datasetService
vi.mock('../../services/datasetService', () => ({
  datasetService: {
    upload: vi.fn().mockResolvedValue({
      id: 1,
      filename: 'test.csv',
      record_count: 10,
      file_type: 'csv',
      file_size: 512,
      status: 'ready',
      user_id: 1,
      upload_time: '2024-01-01T00:00:00Z',
    }),
  },
}))

import { datasetService } from '../../services/datasetService'

function renderUpload(onSuccess = vi.fn()) {
  return render(
    <MemoryRouter>
      <FileUpload onSuccess={onSuccess} />
    </MemoryRouter>
  )
}

function makeFile(name: string, size = 1024, type = 'text/csv') {
  const content = 'a,b\n1,2\n'
  const file = new File([content], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders drop zone with correct label', () => {
    renderUpload()
    expect(screen.getByText('Drag & drop your file here')).toBeInTheDocument()
    expect(screen.getByText(/CSV or JSON/)).toBeInTheDocument()
  })

  it('renders hidden file input accepting csv and json', () => {
    renderUpload()
    const input = document.getElementById('file-input') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.accept).toBe('.csv,.json')
    expect(input.type).toBe('file')
  })

  it('rejects unsupported file types with toast error', async () => {
    renderUpload()
    const input = document.getElementById('file-input') as HTMLInputElement
    const file = makeFile('data.txt', 1024, 'text/plain')
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Only CSV and JSON files are supported')
    )
    expect(datasetService.upload).not.toHaveBeenCalled()
  })

  it('rejects files larger than 50MB', async () => {
    renderUpload()
    const input = document.getElementById('file-input') as HTMLInputElement
    const file = makeFile('huge.csv', 51 * 1024 * 1024 + 1)
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('File must be smaller than 50MB')
    )
    expect(datasetService.upload).not.toHaveBeenCalled()
  })

  it('accepts and uploads a valid CSV file', async () => {
    const onSuccess = vi.fn()
    renderUpload(onSuccess)
    const input = document.getElementById('file-input') as HTMLInputElement
    const file = makeFile('data.csv')
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(datasetService.upload).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })

  it('accepts and uploads a valid JSON file', async () => {
    renderUpload()
    const input = document.getElementById('file-input') as HTMLInputElement
    const file = makeFile('data.json', 512, 'application/json')
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(datasetService.upload).toHaveBeenCalledTimes(1))
  })

  it('shows upload progress bar while uploading', async () => {
    // Make upload hang so we can check uploading state
    let resolve: (v: unknown) => void
    vi.mocked(datasetService.upload).mockImplementation((_file, onProgress) => {
      onProgress?.(50)
      return new Promise((r) => { resolve = r })
    })
    renderUpload()
    const input = document.getElementById('file-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile('data.csv')] } })
    await waitFor(() => expect(screen.getByText(/Uploading/)).toBeInTheDocument())
    // Clean up
    resolve!({ id: 1, filename: 'data.csv', record_count: 5, file_type: 'csv', file_size: 100, status: 'ready', user_id: 1, upload_time: '' })
  })

  it('shows error toast on upload failure', async () => {
    vi.mocked(datasetService.upload).mockRejectedValueOnce({
      response: { data: { detail: 'Server error' } },
    })
    renderUpload()
    const input = document.getElementById('file-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile('data.csv')] } })
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Server error'))
  })

  it('rejects .exe extension', async () => {
    renderUpload()
    const input = document.getElementById('file-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile('malware.exe', 512, 'application/octet-stream')] } })
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Only CSV and JSON files are supported')
    )
  })

  it('accepts exactly 50MB file (boundary)', async () => {
    renderUpload()
    const input = document.getElementById('file-input') as HTMLInputElement
    const file = makeFile('boundary.csv', 50 * 1024 * 1024)
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(datasetService.upload).toHaveBeenCalledTimes(1))
  })
})
