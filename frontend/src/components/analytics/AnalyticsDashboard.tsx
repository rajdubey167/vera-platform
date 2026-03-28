import { useState } from 'react'
import toast from 'react-hot-toast'
import { analyticsService } from '../../services/analyticsService'
import type { AnalyticsResponse, ColumnStats } from '../../types'
import { BarChartCard, PieChartCard, DistributionChart } from './Charts'

interface Props {
  datasetId: number
  datasetName: string
}

type FilterType = 'all' | 'numeric' | 'categorical' | 'datetime'

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

const fmt = (v: any) =>
  typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (v ?? '—')

function SectionTitle({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <h3 className="text-gray-700 dark:text-gray-200 font-semibold text-sm uppercase tracking-wide">{label}</h3>
      <span className="text-gray-400 text-xs">({count})</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

// ─── Numeric: stats table + full-width distribution charts ───────────────────
function NumericSection({ columns }: { columns: [string, ColumnStats][] }) {
  if (columns.length === 0) return null
  return (
    <div className="space-y-3">
      <SectionTitle label="Numeric" count={columns.length} color="bg-indigo-500" />

      {/* Stats summary table */}
      <div className="rounded-xl border border-theme overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-theme" style={{ background: 'var(--bg-inner)' }}>
                {['Column', 'Count', 'Min', 'Q1', 'Median', 'Mean', 'Q3', 'Max', 'Std Dev', 'Unique', 'Missing'].map((h) => (
                  <th key={h} className={`px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider text-[10px] ${h === 'Column' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {columns.map(([col, s]) => (
                <tr key={col} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{col}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{s.count.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{fmt(s.min)}</td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{fmt(s.q1)}</td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{fmt(s.median)}</td>
                  <td className="px-3 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">{fmt(s.mean)}</td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{fmt(s.q3)}</td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{fmt(s.max)}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{typeof s.std === 'number' ? s.std.toFixed(2) : '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{s.unique ?? '—'}</td>
                  <td className="px-3 py-2 text-right">{s.missing > 0 ? <span className="text-red-500 font-medium">{s.missing}</span> : <span className="text-emerald-500">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution charts — 2 per row, full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {columns.map(([col, s], i) =>
          s.mean !== undefined ? (
            <DistributionChart
              key={col}
              title={`${col}-${i}`}
              label={col}
              min={s.min as number}
              q1={s.q1!}
              median={s.median!}
              mean={s.mean}
              q3={s.q3!}
              max={s.max as number}
            />
          ) : null
        )}
      </div>
    </div>
  )
}

// ─── Categorical: 2-col grid, bar + donut per card ───────────────────────────
function CategoricalSection({ columns }: { columns: [string, ColumnStats][] }) {
  if (columns.length === 0) return null
  return (
    <div className="space-y-3">
      <SectionTitle label="Categorical" count={columns.length} color="bg-orange-500" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {columns.map(([col, s], i) => {
          const chartData = (s.top_values ?? []).map((v) => ({ name: String(v.value), value: v.count }))
          const color = CHART_COLORS[i % CHART_COLORS.length]
          return (
            <div key={col} className="rounded-xl border border-theme p-4" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-900 dark:text-white font-semibold text-sm">{col}</span>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span>{s.count.toLocaleString()} values</span>
                  {s.unique !== undefined && <span>· {s.unique} unique</span>}
                  {s.missing > 0 && <span className="text-red-400">· {s.missing} missing</span>}
                </div>
              </div>
              {chartData.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  <BarChartCard title="Top values" data={chartData} color={color} compact />
                  <PieChartCard title="Share" data={chartData} compact />
                </div>
              ) : (
                <p className="text-gray-400 text-xs text-center py-6">No values</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Datetime: compact info strip ────────────────────────────────────────────
function DatetimeSection({ columns, trendCol, spanDays }: {
  columns: [string, ColumnStats][]
  trendCol?: string
  spanDays?: number
}) {
  if (columns.length === 0) return null
  return (
    <div className="space-y-3">
      <SectionTitle label="Datetime" count={columns.length} color="bg-blue-500" />
      <div className="flex flex-wrap gap-3">
        {columns.map(([col, s]) => (
          <div key={col} className="flex items-center gap-3 rounded-xl border border-theme px-4 py-3 flex-1 min-w-[240px]" style={{ background: 'var(--bg-card)' }}>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-900 dark:text-white font-semibold text-sm">{col}</span>
                {col === trendCol && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/15 text-blue-500 font-bold">trend</span>}
              </div>
              <p className="text-gray-500 text-xs mt-0.5">
                {String(s.min).slice(0, 10)} → {String(s.max).slice(0, 10)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-gray-700 dark:text-gray-200 text-xs font-semibold">{s.count.toLocaleString()} rows</p>
              {col === trendCol && spanDays !== undefined && (
                <p className="text-blue-500 text-[10px]">{spanDays} days</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ datasetId, datasetName }: Props) {
  const [result, setResult] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const data = await analyticsService.analyze(datasetId)
      setResult(data)
      toast.success('Analysis complete!')
    } catch {
      toast.error('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const allCols = result ? (Object.entries(result.columns) as [string, ColumnStats][]) : []
  const numericCols = allCols.filter(([, s]) => s.type === 'numeric')
  const categoricalCols = allCols.filter(([, s]) => s.type === 'categorical')
  const datetimeCols = allCols.filter(([, s]) => s.type === 'datetime')

  const showNumeric = filter === 'all' || filter === 'numeric'
  const showCategorical = filter === 'all' || filter === 'categorical'
  const showDatetime = filter === 'all' || filter === 'datetime'

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allCols.length },
    { key: 'numeric', label: 'Numeric', count: numericCols.length },
    { key: 'categorical', label: 'Categorical', count: categoricalCols.length },
    { key: 'datetime', label: 'Datetime', count: datetimeCols.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Intelligence Analysis</h2>
          <p className="text-gray-500 text-sm mt-0.5">{datasetName}</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? (
            <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Analyzing...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Run Analysis</>
          )}
        </button>
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-theme" style={{ background: 'var(--bg-card)' }}>
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">Run Analysis to generate insights</p>
          <p className="text-gray-400 text-sm mt-1">Statistics, charts, anomaly detection and more</p>
        </div>
      )}

      {result && (
        <>
          {/* KPI + Graph Filter in one row */}
          <div className="flex items-stretch gap-3">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              {[
                { label: 'Total Records', value: result.total_records.toLocaleString(), icon: '📋', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Columns', value: allCols.length, icon: '📊', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
                { label: 'Anomalies', value: result.anomalies.length, icon: '⚠️', color: result.anomalies.length > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400', bg: result.anomalies.length > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
                { label: 'Insights', value: result.insights.length, icon: '💡', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-theme p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)' }}>
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center text-base flex-shrink-0`}>{card.icon}</div>
                  <div>
                    <p className={`text-2xl font-bold leading-none ${card.color}`}>{card.value}</p>
                    <p className="text-gray-400 text-xs mt-1">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Graph filter panel */}
            <div className="rounded-xl border border-theme p-3 flex flex-col justify-between gap-2 flex-shrink-0" style={{ background: 'var(--bg-card)', minWidth: '140px' }}>
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Graph Filter</p>
              <div className="flex flex-col gap-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filter === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] ml-2 ${filter === tab.key ? 'opacity-80' : 'text-gray-400'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          {result.insights.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 p-4" style={{ background: 'rgba(245,158,11,0.05)' }}>
              <p className="text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wide mb-2">Auto-Generated Insights</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                {result.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200/80">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    {ins}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections filtered by graph filter */}
          {showDatetime && <DatetimeSection columns={datetimeCols} trendCol={result.trends?.date_column} spanDays={result.trends?.span_days} />}
          {showNumeric && <NumericSection columns={numericCols} />}
          {showCategorical && <CategoricalSection columns={categoricalCols} />}

          {/* Anomalies */}
          {result.anomalies.length > 0 && (filter === 'all' || filter === 'numeric') && (
            <div className="space-y-3">
              <SectionTitle label="Anomalies" count={result.anomalies.length} color="bg-red-500" />
              <div className="rounded-xl border border-theme overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-theme" style={{ background: 'rgba(239,68,68,0.06)' }}>
                        <th className="px-4 py-2.5 text-left text-red-500 font-semibold uppercase tracking-wider text-[10px]">Row</th>
                        <th className="px-4 py-2.5 text-left text-red-500 font-semibold uppercase tracking-wider text-[10px]">Flags</th>
                        <th className="px-4 py-2.5 text-left text-red-500 font-semibold uppercase tracking-wider text-[10px]">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {result.anomalies.map((a) => (
                        <tr key={a.row_index} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">#{a.row_index}</td>
                          <td className="px-4 py-2 text-red-500">{a.flags.join(', ')}</td>
                          <td className="px-4 py-2 text-gray-500 max-w-xs truncate font-mono">{JSON.stringify(a.data)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
