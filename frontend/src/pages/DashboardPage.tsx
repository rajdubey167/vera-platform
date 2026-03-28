import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { datasetService } from '../services/datasetService'
import { adminService } from '../services/adminService'
import type { Dataset, User } from '../types'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const result = await datasetService.list({ limit: 100 })
      setDatasets(result.items)
      if (isAdmin) {
        const allUsers = await adminService.getUsers()
        setUsers(allUsers)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useWebSocket(user?.id ?? null, load)

  const totalRecords = datasets.reduce((s, d) => s + d.record_count, 0)
  const totalStorage = datasets.reduce((s, d) => s + d.file_size, 0)
  const csvCount = datasets.filter(d => d.file_type === 'csv').length
  const jsonCount = datasets.filter(d => d.file_type === 'json').length
  const storagePct = Math.min((totalStorage / (50 * 1024 * 1024)) * 100, 100)
  const recent = [...datasets]
    .sort((a, b) => new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime())
    .slice(0, 8)

  const stats = [
    {
      label: 'Total Datasets',
      value: datasets.length,
      sub: datasets.length > 0 ? `${csvCount} CSV · ${jsonCount} JSON` : 'Upload your first file',
      accent: '#7c3aed', accentBg: 'rgba(124,58,237,0.12)', glow: 'rgba(124,58,237,0.18)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
    {
      label: 'Total Records',
      value: totalRecords.toLocaleString(),
      sub: 'Synced in real-time via WebSocket',
      accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.12)', glow: 'rgba(6,182,212,0.18)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Storage Used',
      value: formatBytes(totalStorage),
      sub: `${storagePct.toFixed(1)}% of 50 MB capacity`,
      showBar: true, barPct: storagePct,
      accent: '#10b981', accentBg: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.18)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
    },
    {
      label: 'Ready to Analyze',
      value: datasets.filter(d => d.record_count > 0).length,
      sub: 'IQR anomaly detection enabled',
      accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.18)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    ...(isAdmin ? [{
      label: 'Total Users',
      value: users.length,
      sub: `${users.filter(u => u.role === 'admin').length} admin · ${users.filter(u => u.role === 'user').length} users`,
      accent: '#ec4899', accentBg: 'rgba(236,72,153,0.12)', glow: 'rgba(236,72,153,0.18)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    }] : []),
  ]

  const quickActions = [
    {
      to: '/upload', label: 'Upload Dataset', desc: 'CSV or JSON',
      accent: '#7c3aed', accentBg: 'rgba(124,58,237,0.1)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
    {
      to: '/datasets', label: 'Browse Datasets', desc: `${datasets.length} available`,
      accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.1)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a8 3 0 0116 0M4 7v10a8 3 0 0016 0V7M4 12a8 3 0 0016 0" />
        </svg>
      ),
    },
    {
      to: '/graph', label: 'Data Graph', desc: 'Relationship explorer',
      accent: '#10b981', accentBg: 'rgba(16,185,129,0.1)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      ),
    },
  ]

  return (
    <div
      style={{ minHeight: '100%', padding: '28px', fontFamily: "'Inter', -apple-system, sans-serif", background: 'var(--bg-main)', position: 'relative' }}
    >
      {/* Dark-mode glow orbs */}
      <div className="hidden dark:block" style={{ position: 'fixed', top: 0, left: 240, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-5%', right: '5%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '15%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 5 }} className="text-gray-900 dark:text-white">
              {getGreeting()},{' '}
              <span style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {isAdmin ? 'Admin' : (user?.full_name?.split(' ')[0] ?? 'there')}
              </span>
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              {isAdmin
                ? 'You have full visibility across all organizational data nodes.'
                : 'Here is your VERA data intelligence workspace overview.'}
            </p>
          </div>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quickActions.map(a => (
              <Link
                key={a.to}
                to={a.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px', borderRadius: 10, textDecoration: 'none',
                  fontSize: 13, fontWeight: 600,
                  border: `1px solid ${a.accent}33`,
                  background: a.accentBg,
                  color: a.accent,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${a.accent}30` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {a.icon}
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {stats.map(stat => (
            <div
              key={stat.label}
              style={{
                borderRadius: 16, padding: '20px 22px',
                border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                background: 'var(--bg-card)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-3px)'
                el.style.boxShadow = `0 12px 36px ${stat.glow}`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: '#94a3b8' }}>
                  {stat.label.toUpperCase()}
                </span>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: stat.accentBg, color: stat.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {stat.icon}
                </div>
              </div>

              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }} className="text-gray-900 dark:text-white">
                {stat.value}
              </div>

              {(stat as { showBar?: boolean; barPct?: number }).showBar && (
                <div style={{ height: 3, borderRadius: 99, marginBottom: 8, overflow: 'hidden' }} className="bg-gray-100 dark:bg-white/10">
                  <div style={{ height: '100%', width: `${(stat as { barPct?: number }).barPct ?? 0}%`, background: `linear-gradient(90deg, ${stat.accent}, ${stat.accent}cc)`, borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
              )}

              <p style={{ fontSize: 12, color: '#64748b' }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Recent Datasets Table ──────────────────────────── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', background: 'var(--bg-card)' }}>

          {/* Table Header */}
          <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.06))' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, letterSpacing: '-0.01em' }} className="text-gray-900 dark:text-white">
                Recent Datasets
              </h2>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>
                {datasets.length > 0 ? `${datasets.length} total · sorted by upload date` : 'No datasets yet'}
              </p>
            </div>
            <Link
              to="/datasets"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                textDecoration: 'none', color: '#7c3aed',
                border: '1px solid rgba(124,58,237,0.25)',
                background: 'rgba(124,58,237,0.07)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.07)' }}
            >
              View all
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', animation: 'dashSpin 0.7s linear infinite' }} />
              <span style={{ fontSize: 14, color: '#94a3b8' }}>Loading datasets…</span>
              <style>{`@keyframes dashSpin { to { transform: rotate(360deg); } }`}</style>
            </div>

          /* Empty state */
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16, margin: '0 auto 18px',
                background: 'rgba(124,58,237,0.1)', color: '#7c3aed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }} className="text-gray-900 dark:text-white">
                No datasets uploaded yet
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 22 }}>
                Upload a CSV or JSON file to start analyzing your data.
              </p>
              <Link
                to="/upload"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', color: 'white',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.35)' }}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Now
              </Link>
            </div>

          /* Table */
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.06))' }}>
                    {['File', 'Type', 'Records', 'Uploaded', ...(isAdmin ? ['Uploaded By'] : []), 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d, i) => (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: i < recent.length - 1 ? '1px solid var(--border-color, rgba(0,0,0,0.04))' : 'none',
                        transition: 'background 0.1s',
                      }}
                      className="hover:bg-black/[0.015] dark:hover:bg-white/[0.025]"
                    >
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                            background: d.file_type === 'csv' ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)',
                            color: d.file_type === 'csv' ? '#10b981' : '#06b6d4',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }} className="text-gray-900 dark:text-white">
                              {d.filename}
                            </p>
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>ID #{d.id}</p>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '13px 20px' }}>
                        <span style={{
                          padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
                          background: d.file_type === 'csv' ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)',
                          color: d.file_type === 'csv' ? '#10b981' : '#06b6d4',
                          border: `1px solid ${d.file_type === 'csv' ? 'rgba(16,185,129,0.25)' : 'rgba(6,182,212,0.25)'}`,
                        }}>
                          {d.file_type.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                        {d.record_count.toLocaleString()}
                      </td>

                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#94a3b8' }}>
                        {formatDate(d.upload_time)}
                      </td>

                      {isAdmin && (
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>
                                {(d.owner_name || d.owner_email || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 1 }} className="text-gray-800 dark:text-gray-200">{d.owner_name || '—'}</p>
                              <p style={{ fontSize: 11, color: '#94a3b8' }}>{d.owner_email || `User #${d.user_id}`}</p>
                            </div>
                          </div>
                        </td>
                      )}

                      <td style={{ padding: '13px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: 'rgba(16,185,129,0.1)', color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.2)',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'statusPulse 2s ease-in-out infinite' }} />
                          Active
                        </span>
                      </td>

                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', gap: 14 }}>
                          <Link
                            to={`/datasets/${d.id}`}
                            style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', textDecoration: 'none', transition: 'opacity 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.65' }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                          >
                            Details
                          </Link>
                          <Link
                            to={`/analytics/${d.id}`}
                            style={{ fontSize: 12, fontWeight: 600, color: '#06b6d4', textDecoration: 'none', transition: 'opacity 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.65' }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                          >
                            Analyze
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* ── Admin: All Users Panel ─────────────────────────── */}
        {isAdmin && users.length > 0 && (
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', background: 'var(--bg-card)', marginTop: 24 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.06))' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, letterSpacing: '-0.01em' }} className="text-gray-900 dark:text-white">
                Registered Users
              </h2>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{users.length} total accounts</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.06))' }}>
                    {['User', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border-color, rgba(0,0,0,0.04))' : 'none', transition: 'background 0.1s' }}
                      className="hover:bg-black/[0.015] dark:hover:bg-white/[0.025]"
                    >
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.role === 'admin' ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'linear-gradient(135deg, #06b6d4, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{u.full_name[0].toUpperCase()}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }} className="text-gray-900 dark:text-white">{u.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#64748b' }}>{u.email}</td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{
                          padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
                          background: u.role === 'admin' ? 'rgba(124,58,237,0.1)' : 'rgba(6,182,212,0.1)',
                          color: u.role === 'admin' ? '#7c3aed' : '#06b6d4',
                          border: `1px solid ${u.role === 'admin' ? 'rgba(124,58,237,0.25)' : 'rgba(6,182,212,0.25)'}`,
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: u.is_active ? '#10b981' : '#ef4444',
                          border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: u.is_active ? '#10b981' : '#ef4444' }} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#94a3b8' }}>{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
