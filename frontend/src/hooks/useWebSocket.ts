import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

export interface WsStats {
  wpm: number
  raw_wpm: number
  accuracy: number
  elapsed_ms: number
  char_index: number
}

const BACKOFF_BASE = 1000
const MAX_RETRIES = 5

export function useWebSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [stats, setStats] = useState<WsStats | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (!sessionId) return

    const token = useAuthStore.getState().accessToken
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws/practice?session_id=${sessionId}&token=${token}`)

    ws.onopen = () => {
      retryCount.current = 0
      setConnected(true)
      setError(null)
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'stats') {
          setStats(msg)
        }
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = (e) => {
      setConnected(false)
      if (e.code === 1000) return // Normal close
      if (retryCount.current >= MAX_RETRIES) {
        setError('连接断开，请刷新页面')
        return
      }
      const delay = Math.min(BACKOFF_BASE * 2 ** retryCount.current, 30000)
      retryCount.current++
      retryTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      // onclose will handle reconnection
    }

    wsRef.current = ws
  }, [sessionId])

  useEffect(() => {
    connect()
    return () => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current)
      }
      wsRef.current?.close(1000)
    }
  }, [connect])

  const send = useCallback((data: { type: string; char: string; timestamp: number; is_correct: boolean }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const close = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
    }
    wsRef.current?.close(1000)
  }, [])

  return { stats, connected, error, send, close }
}
