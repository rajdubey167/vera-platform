import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { recordService } from '../../services/recordService'
import type { DataRecord, PaginatedRecords } from '../../types'
import Pagination from '../common/Pagination'
import Modal from '../common/Modal'
import { useDebounce } from '../../hooks/useDebounce'

interface Props {
  datasetId: number
}

export default function RecordsTable({ datasetId }: Props) {
  const [data, setData] = useState<PaginatedRecords | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [editRecord, setEditRecord] = useState<DataRecord | null>(null)
  const [editJson, setEditJson] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const debouncedSearch = useDebounce(search, 400)

  const load = async () => {
    setLoading(true)
    try {
      const result = await recordService.list({ dataset_id: datasetId, page, limit, search: debouncedSearch || undefined })
      setData(result)
    } catch {
      toast.error('Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [datasetId, page, limit, debouncedSearch])

  const columns = data?.items[0] ? Object.keys(data.items[0].data) : []

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this record?')) return
    try {
      await recordService.delete(id)
      toast.success('Record deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} records?`)) return
    try {
      await Promise.all([...selected].map((id) => recordService.delete(id)))
      toast.success(`${selected.size} records deleted`)
      setSelected(new Set())
      load()
    } catch {
      toast.error('Bulk delete failed')
    }
  }

  const handleSaveEdit = async () => {
    if (!editRecord) return
    try {
      const parsed = JSON.parse(editJson)
      await recordService.update(editRecord.id, parsed)
      toast.success('Record updated')
      setEditRecord(null)
      load()
    } catch {
      toast.error('Invalid JSON or update failed')
    }
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-theme overflow-hidden" style={{ background: 'var(--bg-card)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-theme">
        <div className="flex-1 flex items-center gap-2 border border-theme rounded-lg px-3 py-2" style={{ background: 'var(--bg-inner)' }}>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none w-full"
          />
        </div>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            Delete {selected.size} selected
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No records found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme" style={{ background: 'var(--bg-inner)' }}>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === data?.items.length && (data?.items.length ?? 0) > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(data?.items.map((r) => r.id)))
                      else setSelected(new Set())
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data?.items.map((record) => (
                <tr key={record.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={selected.has(record.id)} onChange={() => toggleSelect(record.id)} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">{record.row_number}</td>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2.5 max-w-xs truncate text-gray-700 dark:text-gray-300">
                      {record.data[col] === null || record.data[col] === undefined
                        ? <span className="text-gray-400 italic">null</span>
                        : String(record.data[col])}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => { setEditRecord(record); setEditJson(JSON.stringify(record.data, null, 2)) }}
                      className="text-blue-500 hover:text-blue-600 text-xs mr-3 font-medium"
                    >Edit</button>
                    <button onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-600 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={limit} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1) }} />}

      <Modal open={!!editRecord} title="Edit Record" onClose={() => setEditRecord(null)}>
        <textarea
          value={editJson}
          onChange={(e) => setEditJson(e.target.value)}
          className="w-full h-64 font-mono text-xs border border-theme rounded-lg p-3 outline-none text-gray-800 dark:text-gray-200"
          style={{ background: 'var(--bg-inner)' }}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setEditRecord(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
          <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">Save</button>
        </div>
      </Modal>
    </div>
  )
}
