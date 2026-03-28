import { useNavigate } from 'react-router-dom'
import type { Dataset } from '../types'
import FileUpload from '../components/upload/FileUpload'

export default function UploadPage() {
  const navigate = useNavigate()

  const handleSuccess = (dataset: Dataset) => {
    setTimeout(() => navigate(`/datasets/${dataset.id}`), 1200)
  }

  return (
    <div className="min-h-full px-6 py-6" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Dataset</h1>
          <p className="text-gray-500 text-sm mt-1">Upload a CSV or JSON file to begin intelligence analysis.</p>
        </div>

        <div className="rounded-xl border border-theme p-6" style={{ background: 'var(--bg-card)' }}>
          <FileUpload onSuccess={handleSuccess} />
        </div>

        <div className="mt-4 rounded-xl border border-blue-500/20 p-4 flex items-start gap-3" style={{ background: 'rgba(59,130,246,0.05)' }}>
          <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            <strong className="text-blue-800 dark:text-blue-200">Supported formats:</strong> CSV (.csv), JSON (.json array or object) · Max 50MB
          </p>
        </div>
      </div>
    </div>
  )
}
