import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { datasetService } from '../services/datasetService'
import type { DatasetDetail } from '../types'
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dataset, setDataset] = useState<DatasetDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    datasetService.get(Number(id))
      .then(setDataset)
      .catch(() => { toast.error('Dataset not found'); navigate('/datasets') })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: 'var(--bg-main)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-full px-6 py-6" style={{ background: 'var(--bg-main)' }}>
      <div className="mb-5">
        <Link to={`/datasets/${id}`} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dataset
        </Link>
      </div>
      {dataset && <AnalyticsDashboard datasetId={dataset.id} datasetName={dataset.filename} />}
    </div>
  )
}
