import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { datasetService } from '../services/datasetService'
import type { PaginatedDatasets } from '../types'
import DatasetCard from '../components/datasets/DatasetCard'
import Pagination from '../components/common/Pagination'
import { useDebounce } from '../hooks/useDebounce'

export default function DatasetsPage() {
  const [data, setData] = useState<PaginatedDatasets | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('')
  const [loading, setLoading] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const load = async () => {
    setLoading(true)
    try {
      const result = await datasetService.list({ page, limit, search: debouncedSearch || undefined, file_type: fileType || undefined })
      setData(result)
    } catch {
      toast.error('Failed to load datasets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, limit, debouncedSearch, fileType])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this dataset and all its records?')) return
    try {
      await datasetService.delete(id)
      toast.success('Dataset deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="min-h-full px-6 py-6" style={{ background: 'var(--bg-main)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Sources</h1>
          <p className="text-gray-500 text-sm mt-0.5">{data?.total ?? 0} datasets total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-48 flex items-center gap-2 border border-theme rounded-lg px-3 py-2" style={{ background: 'var(--bg-card)' }}>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by filename or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none w-full"
          />
        </div>
        <select
          value={fileType}
          onChange={(e) => { setFileType(e.target.value); setPage(1) }}
          className="border border-theme rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none"
          style={{ background: 'var(--bg-card)' }}
        >
          <option value="">All types</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-inner)' }}>
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">No datasets found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different search or upload a new file</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {data?.items.map((d) => (
              <DatasetCard key={d.id} dataset={d} onDelete={handleDelete} />
            ))}
          </div>
          {data && (
            <Pagination page={data.page} pages={data.pages} total={data.total} limit={limit} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1) }} />
          )}
        </>
      )}
    </div>
  )
}
