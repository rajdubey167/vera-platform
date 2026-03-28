import { Link } from 'react-router-dom'
import type { Dataset } from '../../types'

interface Props {
  dataset: Dataset
  onDelete: (id: number) => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DatasetCard({ dataset, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-theme p-5 flex flex-col gap-3 hover:border-theme-strong transition-all" style={{ background: 'var(--bg-card)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold uppercase ${
            dataset.file_type === 'csv' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}>
            {dataset.file_type}
          </span>
          <span className="font-medium text-gray-800 dark:text-white truncate text-sm" title={dataset.filename}>
            {dataset.filename}
          </span>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
          dataset.status === 'ready' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}>
          {dataset.status}
        </span>
      </div>

      <span className="text-xs text-gray-400 font-mono">#{dataset.id}</span>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div><span className="text-gray-700 dark:text-gray-300 font-medium">{dataset.record_count.toLocaleString()}</span> records</div>
        <div><span className="text-gray-700 dark:text-gray-300 font-medium">{formatBytes(dataset.file_size)}</span></div>
        <div className="col-span-2 text-gray-400">{new Date(dataset.upload_time).toLocaleString()}</div>
      </div>

      <div className="flex gap-2 mt-auto pt-3 border-t border-theme">
        <Link
          to={`/datasets/${dataset.id}`}
          className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 transition-all"
          style={{ background: 'rgba(59,130,246,0.05)' }}
        >
          View
        </Link>
        <Link
          to={`/analytics/${dataset.id}`}
          className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/40 transition-all"
          style={{ background: 'rgba(139,92,246,0.05)' }}
        >
          Analyze
        </Link>
        <button
          onClick={() => onDelete(dataset.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 dark:text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all"
          style={{ background: 'rgba(239,68,68,0.05)' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
