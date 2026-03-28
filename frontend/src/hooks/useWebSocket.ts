import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

type WSEvent = {
  event: string
  data: Record<string, unknown>
}

export function useWebSocket(userId: number | null, onRefresh?: () => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onRefreshRef = useRef(onRefresh)
  const mountedRef = useRef(false)

  // Keep onRefreshRef current without re-triggering the effect
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!userId) return
    mountedRef.current = true

    function connect() {
      if (!mountedRef.current) return
      const token = localStorage.getItem('vera_token')
      if (!token) return

      // Close any existing connection before opening a new one
      if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }

      const ws = new WebSocket(`${WS_URL}/ws/${userId}?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => {
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping')
        }, 30000)
      }

      ws.onmessage = (e) => {
        try {
          const msg: WSEvent = JSON.parse(e.data)
          switch (msg.event) {
            case 'upload_complete':
              toast.success(`Upload complete: ${msg.data.filename}`)
              onRefreshRef.current?.()
              break
            case 'analysis_complete':
              toast.success('Analysis complete!')
              onRefreshRef.current?.()
              break
            case 'dataset_deleted':
              toast('Dataset deleted', { icon: '🗑️' })
              onRefreshRef.current?.()
              break
            default:
              break
          }
        } catch (_) {}
      }

      ws.onclose = () => {
        if (pingRef.current) clearInterval(pingRef.current)
        if (mountedRef.current) setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      mountedRef.current = false
      if (pingRef.current) clearInterval(pingRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [userId])
}
