import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const navItems = [
  {
    to: '/dashboard', label: 'Overview',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
  },
  {
    to: '/datasets', label: 'Data Sources',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7a8 3 0 0116 0M4 7v10a8 3 0 0016 0V7M4 12a8 3 0 0016 0" />
      </svg>
    ),
  },
  {
    to: '/upload', label: 'Upload',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    to: '/graph', label: 'Data Graph',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
      </svg>
    ),
  },
]

export function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { user, isAdmin } = useAuth()
  const { pathname } = useLocation()

  return (
    <>
      <aside
        style={{
          position: 'fixed', left: 0, top: 0, height: '100%', width: 240,
          display: 'flex', flexDirection: 'column', zIndex: 40,
          background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
          willChange: 'transform',
        }}
      >
      {/* ── Logo + toggle ──────────────────────────────── */}
      <div style={{ padding: '14px 14px 14px 20px', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--sidebar-text)' }}>VERA</span>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--sidebar-text-muted)', marginTop: -1 }}>DATA INTELLIGENCE</div>
          </div>
        </Link>

        {/* Hide sidebar button */}
        <button
          onClick={onToggle}
          title="Hide sidebar"
          style={{
            width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
            background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--sidebar-text-muted)', transition: 'background 0.15s, color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; e.currentTarget.style.color = 'var(--sidebar-text)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text-muted)' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 9l-2 3 2 3"/>
          </svg>
        </button>
      </div>

      {/* ── Nav ────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 4 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--sidebar-text-muted)', padding: '4px 10px 8px', opacity: 0.6 }}>
            WORKSPACE
          </p>
          {navItems.map(item => {
            const isActive = pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 9, marginBottom: 2,
                  fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  color: isActive ? '#818cf8' : 'var(--sidebar-text-muted)',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.05) 100%)'
                    : 'transparent',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--sidebar-hover-bg)'
                    e.currentTarget.style.color = 'var(--sidebar-text)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--sidebar-text-muted)'
                  }
                }}
              >
                <span style={{ color: isActive ? '#818cf8' : 'var(--sidebar-text-muted)', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </div>

        {isAdmin && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--sidebar-text-muted)', padding: '4px 10px 8px', opacity: 0.6 }}>
              ADMIN
            </p>
            <Link
              to="/users"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, marginBottom: 2,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                transition: 'all 0.15s ease',
                color: pathname === '/users' ? '#818cf8' : 'var(--sidebar-text-muted)',
                background: pathname === '/users'
                  ? 'linear-gradient(90deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.05) 100%)'
                  : 'transparent',
                borderLeft: pathname === '/users' ? '3px solid #6366f1' : '3px solid transparent',
              }}
              onMouseEnter={e => {
                if (pathname !== '/users') {
                  e.currentTarget.style.background = 'var(--sidebar-hover-bg)'
                  e.currentTarget.style.color = 'var(--sidebar-text)'
                }
              }}
              onMouseLeave={e => {
                if (pathname !== '/users') {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--sidebar-text-muted)'
                }
              }}
            >
              <span style={{ color: pathname === '/users' ? '#818cf8' : 'var(--sidebar-text-muted)', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              All Users
            </Link>
          </div>
        )}
      </nav>

      {/* ── Upload CTA ─────────────────────────────────── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--sidebar-border)' }}>
        <Link
          to="/upload"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '10px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white', fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(99,102,241,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)' }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Data
        </Link>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '0 2px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>
              {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--sidebar-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isAdmin ? '✦ Admin' : user?.email}
            </p>
          </div>
        </div>
      </div>
      </aside>
    </>
  )
}

export function TopBar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { pathname } = useLocation()
  const { user, isAdmin, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const tabs = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/datasets', label: 'Datasets' },
    { to: '/upload', label: 'Upload' },
  ]

  return (
    <header
      style={{
        position: 'fixed', top: 0, right: 0, zIndex: 30,
        left: open ? 240 : 0,
        transition: 'left 0.28s cubic-bezier(.4,0,.2,1)',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: open ? '0 20px' : '0 20px 0 62px',
        transition: 'left 0.28s cubic-bezier(.4,0,.2,1), padding-left 0.28s cubic-bezier(.4,0,.2,1)',
        background: 'var(--topbar-bg)', borderBottom: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Reopen button — fixed at left edge of topbar, fades in when sidebar hidden */}
      <button
        onClick={onToggle}
        title="Show sidebar"
        style={{
          position: 'fixed', left: 10, top: 8,
          width: 40, height: 40, borderRadius: 9, border: 'none', cursor: 'pointer',
          background: 'var(--bg-inner)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--sidebar-text-muted)',
          transition: 'opacity 0.2s ease, background 0.15s, color 0.15s',
          opacity: open ? 0 : 1,
          pointerEvents: open ? 'none' : 'auto',
          zIndex: 31,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; e.currentTarget.style.color = 'var(--sidebar-text)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-inner)'; e.currentTarget.style.color = 'var(--sidebar-text-muted)' }}
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l2 3-2 3"/>
        </svg>
      </button>

      {/* Breadcrumb tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {tabs.map(tab => {
          const isActive = pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              style={{
                padding: '5px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                color: isActive ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--sidebar-text)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--sidebar-text-muted)' }}
            >
              {tab.label}
              {isActive && (
                <div style={{ position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: '#6366f1', borderRadius: 99 }} />
              )}
            </Link>
          )
        })}
        {isAdmin && (
          <span style={{ marginLeft: 8, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
            ADMIN
          </span>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: 52, height: 26, borderRadius: 999, position: 'relative',
            border: '1px solid var(--sidebar-border)',
            background: 'var(--bg-inner)',
            cursor: 'pointer', padding: 0,
            transition: 'border-color 0.2s',
          }}
        >
          <svg style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', opacity: isDark ? 0.3 : 1, transition: 'opacity 0.2s' }} width="12" height="12" fill="currentColor" className="text-amber-500" viewBox="0 0 24 24">
            <path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm8-8a1 1 0 110 2h-1a1 1 0 110-2h1zM4 12a1 1 0 110 2H3a1 1 0 110-2h1zm13.657-5.657a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.343 17.657a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17.657 17.657a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zM6.343 6.343a1 1 0 01-1.414 0l-.707-.707A1 1 0 015.636 4.22l.707.707a1 1 0 010 1.414zM12 7a5 5 0 110 10A5 5 0 0112 7z" />
          </svg>
          <svg style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', opacity: isDark ? 1 : 0.3, transition: 'opacity 0.2s' }} width="12" height="12" fill="currentColor" className="text-indigo-400" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
          <span style={{
            position: 'absolute', top: 3,
            left: isDark ? 28 : 3,
            width: 18, height: 18, borderRadius: '50%',
            background: isDark ? '#6366f1' : '#f59e0b',
            transition: 'left 0.25s cubic-bezier(.4,0,.2,1), background 0.25s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        </button>

        {/* Avatar dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: menuOpen ? '0 0 0 2px rgba(99,102,241,0.5)' : 'none',
              transition: 'box-shadow 0.15s',
            }}
          >
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
              {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute', right: 0, top: 40, width: 240,
                borderRadius: 14, overflow: 'hidden',
                background: 'var(--bg-card)',
                border: '1px solid var(--sidebar-border)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
                zIndex: 50,
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--sidebar-border)', background: 'var(--bg-inner)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="text-gray-900 dark:text-white">
                      {user?.full_name}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <span style={{ marginTop: 8, display: 'inline-flex', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    ADMIN
                  </span>
                )}
              </div>

              <div style={{ padding: '8px' }}>
                <button
                  onClick={() => { setMenuOpen(false); logout() }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'transparent', fontSize: 13, fontWeight: 600, color: '#ef4444',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default function Navbar() { return null }
