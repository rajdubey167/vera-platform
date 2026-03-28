import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Invalid email or password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Left Panel — Brand ─────────────────────────────────────── */}
      <div style={{
        flex: '0 0 52%',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1060 40%, #24243e 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 64px',
      }}
        className="hidden md:flex"
      >
        {/* Ambient orbs */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-80px',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'orbFloat 10s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orbFloat 14s ease-in-out infinite alternate-reverse',
        }} />
        <div style={{
          position: 'absolute', top: '55%', left: '30%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'orbFloat 18s ease-in-out infinite alternate',
        }} />

        {/* Decorative ring */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 480, height: 480, borderRadius: '50%',
          border: '1px solid rgba(139,92,246,0.18)',
          animation: 'spin 60s linear infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 320, height: 320, borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.14)',
          animation: 'spin 40s linear infinite reverse',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(99,102,241,0.5)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>VERA</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 52, fontWeight: 900, color: 'white',
            lineHeight: 1.08, letterSpacing: '-0.035em',
            marginBottom: 24, maxWidth: 420,
          }}>
            Turn raw data into<br />
            <span style={{
              background: 'linear-gradient(90deg, #818cf8, #a78bfa, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>sharp insights.</span>
          </h1>

          <p style={{
            fontSize: 16, color: 'rgba(203,213,225,0.8)',
            lineHeight: 1.7, maxWidth: 360, marginBottom: 52,
          }}>
            Upload CSV & JSON datasets, run analytics, detect anomalies,
            and explore relationships — all in one intelligent platform.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '⚡', text: 'Instant analytics on any dataset' },
              { icon: '🔍', text: 'Anomaly detection & insights' },
              { icon: '🕸', text: 'Graph-based relationship explorer' },
            ].map(f => (
              <div key={f.text} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '10px 16px',
                backdropFilter: 'blur(8px)',
                width: 'fit-content',
              }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ fontSize: 14, color: 'rgba(226,232,240,0.9)', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes orbFloat {
            from { transform: translateY(0px) scale(1); }
            to   { transform: translateY(-30px) scale(1.05); }
          }
          @keyframes spin {
            from { transform: translate(-50%,-50%) rotate(0deg); }
            to   { transform: translate(-50%,-50%) rotate(360deg); }
          }
        `}</style>
      </div>

      {/* ── Right Panel — Form ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 32px',
        background: '#ffffff',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: 36 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 28, fontWeight: 700, color: '#0f172a',
              letterSpacing: '-0.025em', marginBottom: 8,
            }}>Welcome back</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>Sign in to your VERA account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  height: 50, padding: '0 16px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 12, fontSize: 15, color: '#0f172a',
                  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366f1'
                  e.target.style.boxShadow = '0 0 0 3.5px rgba(99,102,241,0.15)'
                  e.target.style.background = '#fff'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = '#f8fafc'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
                <a href="#" style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    height: 50, padding: '0 48px 0 16px',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 12, fontSize: 15, color: '#0f172a',
                    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366f1'
                    e.target.style.boxShadow = '0 0 0 3.5px rgba(99,102,241,0.15)'
                    e.target.style.background = '#fff'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                    e.target.style.background = '#f8fafc'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', padding: 4,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 52, borderRadius: 12,
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none', color: 'white',
                fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.01em',
                transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
                marginTop: 28,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.5)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)'
              }}
            >
              {loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'spin360 0.7s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <style>{`@keyframes spin360 { to { transform: rotate(360deg); } }`}</style>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              NEW TO VERA?
            </span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Sign up link */}
          <Link
            to="/signup"
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box',
              height: 50, borderRadius: 12, textAlign: 'center', lineHeight: '50px',
              border: '1.5px solid #e2e8f0', color: '#374151',
              fontSize: 15, fontWeight: 600, textDecoration: 'none',
              transition: 'border-color 0.2s, color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#6366f1'
              e.currentTarget.style.color = '#6366f1'
              e.currentTarget.style.background = '#f5f3ff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.color = '#374151'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Create an account
          </Link>

          <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
            By signing in, you agree to VERA's terms of service<br />and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}
