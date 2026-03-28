import { useEffect, useRef, useState, useCallback } from 'react'
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY,
} from 'd3-force'
import { graphService } from '../services/graphService'
import type { GraphNode, GraphLink } from '../services/graphService'

const DATASET_R = 30
const COLUMN_R  = 14

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
}

interface SimLink {
  source: SimNode
  target: SimNode
  shared: boolean
}

function useD3Force(
  rawNodes: GraphNode[],
  rawLinks: GraphLink[],
  width: number,
  height: number,
): { nodes: SimNode[]; links: SimLink[] } {
  const [nodes, setNodes] = useState<SimNode[]>([])
  const [links, setLinks] = useState<SimLink[]>([])
  const simRef = useRef<ReturnType<typeof forceSimulation> | null>(null)

  useEffect(() => {
    if (!rawNodes.length) { setNodes([]); setLinks([]); return }

    // Stop any existing simulation
    simRef.current?.stop()

    // Deep-copy nodes so d3 can mutate x/y freely
    const simNodes: SimNode[] = rawNodes.map(n => ({
      ...n,
      x: width  / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0, vy: 0,
    }))

    const nodeById = new Map(simNodes.map(n => [n.id, n]))

    const simLinks: SimLink[] = rawLinks
      .map(lk => {
        const source = nodeById.get(lk.source)
        const target = nodeById.get(lk.target)
        if (!source || !target) return null
        return { source, target, shared: lk.shared }
      })
      .filter(Boolean) as SimLink[]

    const sim = forceSimulation<SimNode>(simNodes)
      // Link force — keeps connected nodes at a comfortable distance
      .force('link', forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(d => {
          const src = d.source as SimNode
          const tgt = d.target as SimNode
          const r = (src.type === 'dataset' ? DATASET_R : COLUMN_R)
                  + (tgt.type === 'dataset' ? DATASET_R : COLUMN_R)
          return r + 60   // gap between node edges
        })
        .strength(0.4),
      )
      // Many-body repulsion — negative = push apart
      .force('charge', forceManyBody()
        .strength((d: SimNode) => d.type === 'dataset' ? -800 : -300)
        .distanceMin(20)
        .distanceMax(400),
      )
      // Hard collision — prevents any two circles from physically overlapping
      .force('collide', forceCollide<SimNode>()
        .radius(d => (d.type === 'dataset' ? DATASET_R : COLUMN_R) + 10)
        .strength(1)
        .iterations(4),
      )
      // Gentle pull to center
      .force('center', forceCenter(width / 2, height / 2).strength(0.05))
      // Soft boundary forces so nodes don't escape the canvas
      .force('boundX', forceX(width / 2).strength(0.04))
      .force('boundY', forceY(height / 2).strength(0.04))
      .alphaDecay(0.028)   // settles in ~120 ticks (~2 sec at 60fps)
      .velocityDecay(0.4)

    sim.on('tick', () => {
      // Clamp nodes to canvas bounds (accounting for label below)
      simNodes.forEach(n => {
        const r  = n.type === 'dataset' ? DATASET_R : COLUMN_R
        const padBottom = r + 30
        const padSide   = r + 50
        n.x = Math.max(padSide, Math.min(width  - padSide,   n.x ?? width  / 2))
        n.y = Math.max(r + 8,   Math.min(height - padBottom, n.y ?? height / 2))
      })
      setNodes([...simNodes])
      setLinks([...simLinks])
    })

    sim.on('end', () => {
      setNodes([...simNodes])
      setLinks([...simLinks])
    })

    simRef.current = sim
    return () => { sim.stop() }
  }, [rawNodes, rawLinks, width, height])

  return { nodes, links }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GraphPage() {
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[]; available: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<SimNode | null>(null)
  const svgRef  = useRef<SVGSVGElement>(null)
  const W = 960, H = 580

  const { nodes: simNodes, links: simLinks } = useD3Force(data?.nodes ?? [], data?.links ?? [], W, H)

  useEffect(() => {
    graphService.getGraph()
      .then(setData)
      .catch(() => setData({ nodes: [], links: [], available: false }))
      .finally(() => setLoading(false))
  }, [])

  const datasetCount = data?.nodes.filter(n => n.type === 'dataset').length ?? 0
  const columnCount  = data?.nodes.filter(n => n.type === 'column').length  ?? 0
  const sharedCols   = data?.nodes.filter(n => n.type === 'column' && (n.dataset_count ?? 0) > 1).length ?? 0

  return (
    <div className="min-h-full px-6 py-6 space-y-5" style={{ background: 'var(--bg-main)' }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Graph</h1>
          <p className="text-gray-500 text-sm mt-1">Neo4j-powered relationship map of datasets and shared columns</p>
        </div>
        <a
          href="http://localhost:7474"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-theme text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          style={{ background: 'var(--bg-card)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Neo4j Browser
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Datasets',       value: datasetCount, color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/10',    dot: '#3b82f6' },
          { label: 'Columns',        value: columnCount,  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10',  dot: '#8b5cf6' },
          { label: 'Shared Columns', value: sharedCols,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', dot: '#10b981' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-theme p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)' }}>
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
              <span className="w-3 h-3 rounded-full" style={{ background: c.dot }} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graph canvas */}
      <div className="rounded-xl border border-theme overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme" style={{ background: 'var(--bg-inner)' }}>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" />Dataset</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" />Column</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Shared column</span>
          </div>
          {!data?.available && !loading && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Neo4j connecting…
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : !data?.available ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="font-medium">Neo4j is starting up</p>
            <p className="text-sm mt-1">Upload a dataset and refresh once Neo4j is ready</p>
          </div>
        ) : simNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="font-medium">No graph data yet</p>
            <p className="text-sm mt-1">Upload datasets to see the relationship graph</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: 'block' }}
          >
            <defs>
              <radialGradient id="gd-dataset" cx="35%" cy="35%">
                <stop offset="0%"   stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </radialGradient>
              <radialGradient id="gd-col-single" cx="35%" cy="35%">
                <stop offset="0%"   stopColor="#c4b5fd" />
                <stop offset="100%" stopColor="#7c3aed" />
              </radialGradient>
              <radialGradient id="gd-col-shared" cx="35%" cy="35%">
                <stop offset="0%"   stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#059669" />
              </radialGradient>
              <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Links */}
            <g>
              {simLinks.map((lk, i) => {
                const src = lk.source
                const tgt = lk.target
                const isShared = (tgt.dataset_count ?? 0) > 1
                return (
                  <line
                    key={i}
                    x1={src.x} y1={src.y}
                    x2={tgt.x} y2={tgt.y}
                    stroke={isShared ? '#10b981' : 'currentColor'}
                    strokeWidth={isShared ? 1.8 : 1}
                    strokeOpacity={isShared ? 0.55 : 0.25}
                    strokeDasharray={isShared ? undefined : '4 3'}
                    className="text-gray-400"
                  />
                )
              })}
            </g>

            {/* Nodes */}
            <g>
              {simNodes.map(node => {
                const isDataset = node.type === 'dataset'
                const isShared  = !isDataset && (node.dataset_count ?? 0) > 1
                const r    = isDataset ? DATASET_R : COLUMN_R
                const fill = isDataset ? 'url(#gd-dataset)' : isShared ? 'url(#gd-col-shared)' : 'url(#gd-col-single)'
                const isHov = hovered?.id === node.id

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
                    style={{ cursor: 'default' }}
                    onMouseEnter={() => setHovered(node)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {isHov && (
                      <circle r={r + 7} fill="none"
                        stroke={isDataset ? '#3b82f6' : isShared ? '#10b981' : '#8b5cf6'}
                        strokeWidth={2} strokeOpacity={0.35}
                      />
                    )}
                    <circle r={r} fill={fill} filter="url(#shadow)" />

                    {isDataset ? (
                      <>
                        <text textAnchor="middle" dy="-5" fontSize={9} fill="white" fontWeight={700} opacity={0.9}>
                          {node.file_type?.toUpperCase()}
                        </text>
                        <text textAnchor="middle" dy="7" fontSize={7.5} fill="white" opacity={0.75}>
                          {(node.record_count ?? 0).toLocaleString()} rows
                        </text>
                      </>
                    ) : (
                      <text textAnchor="middle" dy="4" fontSize={7.5} fill="white" fontWeight={600} opacity={0.9}>
                        {node.label.length > 10 ? node.label.slice(0, 9) + '…' : node.label}
                      </text>
                    )}

                    {/* Label below */}
                    <text
                      textAnchor="middle"
                      dy={r + 13}
                      fontSize={isDataset ? 11 : 9}
                      fontWeight={isDataset ? 700 : 400}
                      fill="var(--tooltip-color)"
                      opacity={isHov ? 1 : 0.8}
                    >
                      {node.label.length > 18 ? node.label.slice(0, 17) + '…' : node.label}
                    </text>
                    {isShared && (
                      <text textAnchor="middle" dy={r + 24} fontSize={8} fill="#10b981">
                        shared · {node.dataset_count}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>

            {/* Hover tooltip */}
            {hovered && (() => {
              const tx = Math.min((hovered.x ?? 0) + 14, W - 185)
              const ty = Math.max((hovered.y ?? 0) - 65, 8)
              const h  = hovered.type === 'dataset' ? 70 : 56
              return (
                <g transform={`translate(${tx},${ty})`} style={{ pointerEvents: 'none' }}>
                  <rect width={175} height={h} rx={8}
                    fill="var(--tooltip-bg)" stroke="var(--tooltip-border)"
                    strokeWidth={1} filter="url(#shadow)"
                  />
                  <text x={12} y={20} fontSize={11} fontWeight={700} fill="var(--tooltip-color)">{hovered.label}</text>
                  <text x={12} y={35} fontSize={10} fill="#9ca3af">
                    {hovered.type === 'dataset'
                      ? `${hovered.file_type?.toUpperCase()} · ${(hovered.record_count ?? 0).toLocaleString()} records`
                      : `Column · ${hovered.dataset_count} dataset(s)`}
                  </text>
                  {hovered.type === 'dataset' && (
                    <text x={12} y={52} fontSize={10} fill="#9ca3af">ID: {hovered.dataset_id}</text>
                  )}
                </g>
              )
            })()}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-theme p-4" style={{ background: 'var(--bg-card)' }}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">How to read this graph</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-500">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5 flex-shrink-0" />
            <span><strong className="text-gray-700 dark:text-gray-200">Blue nodes</strong> — uploaded datasets.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 mt-0.5 flex-shrink-0" />
            <span><strong className="text-gray-700 dark:text-gray-200">Purple nodes</strong> — columns unique to one dataset.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-0.5 flex-shrink-0" />
            <span><strong className="text-gray-700 dark:text-gray-200">Green nodes</strong> — columns shared across datasets (potential join keys).</span>
          </div>
        </div>
      </div>
    </div>
  )
}
