import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { datasetService } from '../../services/datasetService'
import type { Dataset } from '../../types'

interface Props {
  onSuccess?: (dataset: Dataset) => void
}

export default function FileUpload({ onSuccess }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'json'].includes(ext || '')) { toast.error('Only CSV and JSON files are supported'); return }
    if (file.size > 50 * 1024 * 1024) { toast.error('File must be smaller than 50MB'); return }

    setUploading(true)
    setProgress(0)
    try {
      const dataset = await datasetService.upload(file, setProgress)
      toast.success(`Uploaded "${dataset.filename}" — ${dataset.record_count} records`)
      onSuccess?.(dataset)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onSuccess])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div className="w-full">
      <label
        htmlFor="file-input"
        className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragging ? 'border-blue-500 bg-blue-500/5' : 'border-theme hover:border-blue-400 hover:bg-blue-500/5'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3 w-full px-8">
            <div className="text-blue-500 font-medium text-sm">Uploading... {progress}%</div>
            <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg-inner)' }}>
              <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Drag & drop your file here</p>
              <p className="text-gray-400 text-xs mt-1">or click to browse</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs text-gray-500 border border-theme" style={{ background: 'var(--bg-inner)' }}>
              CSV or JSON · max 50MB
            </span>
          </div>
        )}
      </label>
      <input id="file-input" type="file" accept=".csv,.json" className="hidden" onChange={onInputChange} disabled={uploading} />
    </div>
  )
}
