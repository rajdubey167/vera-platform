import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { Sidebar, TopBar } from './components/common/Navbar'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import DatasetsPage from './pages/DatasetsPage'
import DatasetDetailPage from './pages/DatasetDetailPage'
import AnalyticsPage from './pages/AnalyticsPage'
import GraphPage from './pages/GraphPage'

const SIDEBAR_W = 240

function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <Sidebar open={open} onToggle={() => setOpen(v => !v)} />

      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main area shifts with sidebar */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: open ? SIDEBAR_W : 0,
          transition: 'margin-left 0.28s cubic-bezier(.4,0,.2,1)',
          minWidth: 0,
        }}
      >
        <TopBar open={open} onToggle={() => setOpen(v => !v)} />
        <main style={{ flex: 1, paddingTop: 56, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function ToasterWrapper() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: isDark
          ? { background: '#1f2937', color: '#f9fafb', border: '1px solid rgba(255,255,255,0.1)' }
          : { background: '#ffffff', color: '#0f172a', border: '1px solid rgba(0,0,0,0.1)' },
      }}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToasterWrapper />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute><AppLayout><UploadPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/datasets" element={
              <ProtectedRoute><AppLayout><DatasetsPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/datasets/:id" element={
              <ProtectedRoute><AppLayout><DatasetDetailPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/analytics/:id" element={
              <ProtectedRoute><AppLayout><AnalyticsPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/graph" element={
              <ProtectedRoute><AppLayout><GraphPage /></AppLayout></ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
