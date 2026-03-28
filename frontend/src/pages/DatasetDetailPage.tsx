import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { datasetService } from '../services/datasetService'
import type { DatasetDetail } from '../types'
import RecordsTable from '../components/datasets/RecordsTable'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DatasetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dataset, setDataset] = useState<DatasetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'preview' | 'records'>('preview')

  useEffect(() => {
    if (!id) return
    datasetService.get(Number(id))
      .then(setDataset)
      .catch(() => { toast.error('Dataset not found'); navigate('/datasets') })
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!dataset || !confirm('Delete this dataset and all its records?')) return
    try {
      await datasetService.delete(dataset.id)
      toast.success('Dataset deleted')
      navigate('/datasets')
    } catch {
      toast.error('Delete failed')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: 'var(--bg-main)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!dataset) return null

  const columns = dataset.preview[0] ? Object.keys(dataset.preview[0]) : []

  return (
    <div className="min-h-full px-6 py-6" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link to="/datasets" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm flex items-center gap-1 mb-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Datasets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dataset.filename}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${dataset.file_type === 'csv' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
              {dataset.file_type}
            </span>
            <span>{dataset.record_count.toLocaleString()} records</span>
            <span>{formatBytes(dataset.file_size)}</span>
            <span>{new Date(dataset.upload_time).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/analytics/${dataset.id}`}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analyze
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit border border-theme" style={{ background: 'var(--bg-card)' }}>
        {(['preview', 'records'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t === 'preview' ? `👁 Preview (10 rows)` : `📋 All Records (${dataset.record_count.toLocaleString()})`}
          </button>
        ))}
      </div>

      {tab === 'preview' ? (
        <div className="rounded-xl border border-theme overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          <div className="overflow-x-auto">
            {columns.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No preview available</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme" style={{ background: 'var(--bg-inner)' }}>
                    {columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {dataset.preview.map((row, i) => (
                    <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                          {row[col] === null || row[col] === undefined
                            ? <span className="text-gray-400 italic">null</span>
                            : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <RecordsTable datasetId={dataset.id} />
      )}
    </div>
  )
}
