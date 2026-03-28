import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LabelList, Cell, ReferenceLine,
  PieChart, Pie, Legend, Label,
  AreaChart, Area, ReferenceArea,
} from 'recharts'

export const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
const axisStyle = { fontSize: 10, fill: '#9ca3af' }

// ─── Tooltips ────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)',
      borderRadius: '10px', color: 'var(--tooltip-color)', fontSize: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '10px 14px', minWidth: '120px',
    }}>
      {label && <p style={{ color: '#9ca3af', fontSize: '10px', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill || '#6366f1', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: 'var(--tooltip-color)' }}>
            {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
          </span>
          {p.payload?.pct !== undefined && (
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>({p.payload.pct}%)</span>
          )}
        </div>
      ))}
    </div>
  )
}

const DistTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{
      backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)',
      borderRadius: '10px', padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }}>
      <p style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
      <p style={{ color: p.color, fontWeight: 700, fontSize: '13px' }}>
        {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
      </p>
    </div>
  )
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────
interface BarProps {
  data: { name: string; value: number }[]
  title: string
  color?: string
  compact?: boolean
}

export function BarChartCard({ data, title, compact }: BarProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const avg = total / (data.length || 1)
  const enriched = data.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 }))
  const height = compact ? 165 : 220

  return (
    <div className="rounded-xl p-3 border border-theme" style={{ background: 'var(--bg-chart)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <span className="text-[10px] text-gray-400">avg {avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={enriched} margin={{ top: 20, right: 6, bottom: compact ? 22 : 30, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} angle={-25} textAnchor="end" axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
          {/* Average reference line */}
          <ReferenceLine y={avg} stroke="#9ca3af" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: 'avg', position: 'insideTopRight', fill: '#9ca3af', fontSize: 9 }} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={44}>
            {enriched.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.88} />
            ))}
            <LabelList
              dataKey="pct"
              position="top"
              formatter={(v: any) => `${v}%`}
              style={{ fontSize: '10px', fill: '#9ca3af', fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Donut / Pie Chart ────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.07) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

interface PieProps {
  data: { name: string; value: number }[]
  title: string
  compact?: boolean
}

export function PieChartCard({ data, title, compact }: PieProps) {
  // Group small slices into "Others"
  const total = data.reduce((s, d) => s + d.value, 0)
  const TOP = compact ? 5 : 7
  const top = data.slice(0, TOP)
  const rest = data.slice(TOP)
  const othersVal = rest.reduce((s, d) => s + d.value, 0)
  const display = othersVal > 0 ? [...top, { name: 'Others', value: othersVal }] : top
  const enriched = display.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 }))

  const totalLabel = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total)
  const outerR = compact ? 60 : 74
  const innerR = compact ? 30 : 38
  const height = compact ? 165 : 240

  return (
    <div className="rounded-xl p-3 border border-theme" style={{ background: 'var(--bg-chart)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <span className="text-[10px] text-gray-400">{data.length} categories</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={enriched}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy={compact ? '48%' : '44%'}
            outerRadius={outerR}
            innerRadius={innerR}
            strokeWidth={2}
            stroke="var(--bg-chart)"
            paddingAngle={2}
            labelLine={false}
            label={renderPieLabel}
          >
            {enriched.map((_, i) => (
              <Cell key={i} fill={i === TOP ? '#6b7280' : COLORS[i % COLORS.length]} />
            ))}
            <Label
              content={({ viewBox }: any) => {
                const { cx: vx, cy: vy } = viewBox
                return (
                  <g>
                    <text x={vx} y={vy - 6} textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: '14px', fontWeight: 800, fill: 'var(--tooltip-color)' }}>
                      {totalLabel}
                    </text>
                    <text x={vx} y={vy + 11} textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: '9px', fill: '#9ca3af', letterSpacing: '0.05em' }}>
                      TOTAL
                    </text>
                  </g>
                )
              }}
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {!compact && (
            <Legend
              iconType="circle" iconSize={8}
              formatter={(value, entry: any) => (
                <span style={{ fontSize: '11px', color: 'var(--tooltip-color)' }}>
                  {value} <span style={{ color: '#9ca3af' }}>({entry.payload?.pct ?? 0}%)</span>
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {/* Compact inline legend with % */}
      {compact && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 px-0.5">
          {enriched.map((d, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--tooltip-color)' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: i === TOP ? '#6b7280' : COLORS[i % COLORS.length] }} />
              {d.name}
              <span className="text-gray-400">({d.pct}%)</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Distribution / Box-plot style ───────────────────────────────────────────
interface DistributionProps {
  title: string
  label?: string
  min: number
  max: number
  mean: number
  median: number
  q1: number
  q3: number
  compact?: boolean
}

export function DistributionChart({ title, label, min, q1, median, mean, q3, max, compact }: DistributionProps) {
  const data = [
    { name: 'Min', value: Number(min?.toFixed(2)), key: 'min' },
    { name: 'Q1', value: Number(q1?.toFixed(2)), key: 'q1' },
    { name: 'Median', value: Number(median?.toFixed(2)), key: 'median' },
    { name: 'Mean', value: Number(mean?.toFixed(2)), key: 'mean' },
    { name: 'Q3', value: Number(q3?.toFixed(2)), key: 'q3' },
    { name: 'Max', value: Number(max?.toFixed(2)), key: 'max' },
  ]
  const gradId = `dist-${title.replace(/\W/g, '')}`
  const height = compact ? 120 : 190

  return (
    <div className="rounded-xl p-3 border border-theme" style={{ background: 'var(--bg-chart)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label ?? 'Distribution'}</p>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-violet-500" />median</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-dashed border-orange-400" />mean</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-indigo-500/20" />IQR</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 4, left: -10 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={34} />
          <Tooltip content={<DistTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 2' }} />

          {/* IQR shaded band (Q1 → Q3) */}
          <ReferenceArea x1="Q1" x2="Q3" fill="#6366f1" fillOpacity={0.12} stroke="#6366f1" strokeOpacity={0.25} strokeWidth={1} />

          {/* Median line */}
          <ReferenceLine x="Median" stroke="#8b5cf6" strokeWidth={2}
            label={{ value: `${median?.toFixed(1)}`, position: 'insideTopRight', fill: '#8b5cf6', fontSize: 9, fontWeight: 700 }} />

          {/* Mean line (dashed) */}
          <ReferenceLine x="Mean" stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 3"
            label={{ value: `${mean?.toFixed(1)}`, position: 'insideTopLeft', fill: '#f97316', fontSize: 9, fontWeight: 700 }} />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={{ fill: '#8b5cf6', strokeWidth: 0, r: compact ? 3 : 4 }}
            activeDot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: 'var(--bg-chart)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatCard(props: DistributionProps) {
  return <DistributionChart {...props} />
}

export function LineChartCard({ data, xKey, yKey, title }: { data: Record<string, unknown>[]; xKey: string; yKey: string; title: string }) {
  return (
    <div className="rounded-xl p-3 border border-theme" style={{ background: 'var(--bg-chart)' }}>
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 6, bottom: 24, left: -10 }}>
          <defs>
            <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={xKey} tick={axisStyle} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={yKey} stroke="#06b6d4" strokeWidth={2} fill="url(#line-grad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
