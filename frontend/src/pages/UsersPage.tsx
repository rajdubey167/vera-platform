import { useEffect, useState } from 'react'
import { adminService } from '../services/adminService'
import type { User } from '../types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getUsers().then(setUsers).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100%', padding: '28px', fontFamily: "'Inter', -apple-system, sans-serif", background: 'var(--bg-main)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }} className="text-gray-900 dark:text-white">
          Registered Users
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>{users.length} total accounts on the platform</p>
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', background: 'var(--bg-card)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 14, color: '#94a3b8' }}>Loading users…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
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
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.role === 'admin' ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'linear-gradient(135deg, #06b6d4, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{u.full_name[0].toUpperCase()}</span>
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
        )}
      </div>
    </div>
  )
}
