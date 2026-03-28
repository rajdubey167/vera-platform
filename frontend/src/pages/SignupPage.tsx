import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

function passwordStrength(p: string): { score: number; label: string; color: string } {
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(p)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#f87171', '#fbbf24', '#60a5fa', '#34d399']
  return { score, label: labels[score] || '', color: colors[score] || '' }
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  height: 50, padding: '0 16px',
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: 12, fontSize: 15, color: '#0f172a',
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function focusIn(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#6366f1'
  e.target.style.boxShadow = '0 0 0 3.5px rgba(99,102,241,0.15)'
  e.target.style.background = '#fff'
}
function focusOut(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#e2e8f0'
  e.target.style.boxShadow = 'none'
  e.target.style.background = '#f8fafc'
}

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirm: '', full_name: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const strength = passwordStrength(form.password)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await signup(form.email, form.password, form.full_name, 'user')
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      const msg = Array.isArray(detail) ? detail.map((d: { msg: string }) => d.msg).join(', ') : String(detail || 'Registration failed')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Left Panel ─────────────────────────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{
          flex: '0 0 48%',
          background: 'linear-gradient(135deg, #0f0c29 0%, #1a1060 40%, #24243e 100%)',
          position: 'relative', overflow: 'hidden',
          flexDirection: 'column', justifyContent: 'center',
          padding: '60px 60px',
        }}
      >
        {/* Orbs */}
        <div style={{ position:'absolute', top:'-80px', right:'-60px', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', filter:'blur(45px)', animation:'orbFloat 10s ease-in-out infinite alternate' }} />
        <div style={{ position:'absolute', bottom:'-80px', left:'-40px', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)', filter:'blur(55px)', animation:'orbFloat 14s ease-in-out infinite alternate-reverse' }} />
        <div style={{ position:'absolute', top:'45%', right:'20%', width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)', filter:'blur(60px)', animation:'orbFloat 18s ease-in-out infinite alternate' }} />

        {/* Rings */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:460, height:460, borderRadius:'50%', border:'1px solid rgba(139,92,246,0.15)', animation:'spin 60s linear infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:300, height:300, borderRadius:'50%', border:'1px solid rgba(99,102,241,0.12)', animation:'spin 40s linear infinite reverse', pointerEvents:'none' }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:52 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, #6366f1, #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 24px rgba(99,102,241,0.5)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize:22, fontWeight:800, color:'white', letterSpacing:'-0.02em' }}>VERA</span>
          </div>

          <h1 style={{ fontSize:46, fontWeight:900, color:'white', lineHeight:1.1, letterSpacing:'-0.035em', marginBottom:20, maxWidth:380 }}>
            Start your data<br />
            <span style={{ background:'linear-gradient(90deg, #818cf8, #a78bfa, #38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              journey today.
            </span>
          </h1>

          <p style={{ fontSize:15, color:'rgba(203,213,225,0.8)', lineHeight:1.7, maxWidth:340, marginBottom:44 }}>
            Create a free account and start analyzing your data in minutes. No credit card required.
          </p>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:340 }}>
            {[
              { value:'∞', label:'Datasets' },
              { value:'< 1s', label:'Analysis time' },
              { value:'10+', label:'Chart types' },
              { value:'100%', label:'Private & secure' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'14px 16px', backdropFilter:'blur(8px)' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'white', letterSpacing:'-0.02em' }}>{s.value}</div>
                <div style={{ fontSize:12, color:'rgba(148,163,184,0.9)', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes orbFloat { from { transform: translateY(0px) scale(1); } to { transform: translateY(-28px) scale(1.04); } }
          @keyframes spin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
          @keyframes spin360 { to { transform: rotate(360deg); } }
        `}</style>
      </div>

      {/* ── Right Panel — Form ─────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'48px 32px', background:'#ffffff', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* Mobile logo */}
          <div className="flex md:hidden" style={{ justifyContent:'center', marginBottom:32 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg, #6366f1, #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
          </div>

          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:26, fontWeight:700, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:7 }}>Create your account</h2>
            <p style={{ fontSize:15, color:'#64748b' }}>Free forever. No credit card needed.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Field label="Full name">
              <input type="text" required value={form.full_name} onChange={set('full_name')}
                placeholder="Jane Doe" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>

            <Field label="Email address">
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="you@company.com" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>

            <Field label="Password">
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  required value={form.password} onChange={set('password')}
                  placeholder="Min 8 chars, uppercase, number"
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={focusIn} onBlur={focusOut}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4, display:'flex', alignItems:'center' }}>
                  {showPw ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {form.password && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
                  <div style={{ flex:1, height:3, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:99, width:`${strength.score * 25}%`, background:strength.color, transition:'width 0.3s, background 0.3s' }} />
                  </div>
                  <span style={{ fontSize:12, color:strength.color, fontWeight:600, minWidth:36 }}>{strength.label}</span>
                </div>
              )}
            </Field>

            <Field label="Confirm password">
              <input type="password" required value={form.confirm} onChange={set('confirm')}
                placeholder="••••••••••" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>

            <button
              type="submit" disabled={loading}
              style={{
                width:'100%', height:52, borderRadius:12, marginTop:8,
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border:'none', color:'white', fontSize:15, fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing:'-0.01em',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                transition:'transform 0.2s, box-shadow 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(99,102,241,0.5)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=loading?'none':'0 4px 20px rgba(99,102,241,0.4)' }}
            >
              {loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin360 0.7s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
              )}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'26px 0' }}>
            <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
            <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600, letterSpacing:'0.08em' }}>ALREADY HAVE AN ACCOUNT?</span>
            <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
          </div>

          <Link
            to="/login"
            style={{ display:'block', width:'100%', boxSizing:'border-box', height:50, borderRadius:12, textAlign:'center', lineHeight:'50px', border:'1.5px solid #e2e8f0', color:'#374151', fontSize:15, fontWeight:600, textDecoration:'none', transition:'border-color 0.2s, color 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#6366f1'; e.currentTarget.style.background='#f5f3ff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#374151'; e.currentTarget.style.background='transparent' }}
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  )
}
