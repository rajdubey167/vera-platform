interface Props {
  page: number
  pages: number
  total: number
  limit: number
  onPage: (p: number) => void
  onLimit: (l: number) => void
}

export default function Pagination({ page, pages, total, limit, onPage, onLimit }: Props) {
  const btnClass = "px-2.5 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-theme mt-2" style={{ background: 'var(--bg-card)' }}>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimit(Number(e.target.value))}
          className="border border-theme rounded-lg px-2 py-1 text-sm text-gray-700 dark:text-gray-300 outline-none"
          style={{ background: 'var(--bg-inner)' }}
        >
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="ml-2 text-gray-400">
          {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(1)} disabled={page === 1} className={btnClass}>«</button>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className={btnClass}>‹</button>
        <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">{page} / {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page === pages} className={btnClass}>›</button>
        <button onClick={() => onPage(pages)} disabled={page === pages} className={btnClass}>»</button>
      </div>
    </div>
  )
}
