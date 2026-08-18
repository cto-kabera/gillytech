import { useEffect, useRef, useCallback, useState } from 'react'

export function useWebSocket(sessionId, onMessage) {
  const ws = useRef(null)
  const [connected, setConnected] = useState(false)
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  useEffect(() => {
    if (!sessionId) return
    const token = localStorage.getItem('gt_token')
    if (!token) return
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${proto}://${location.host}/ws?sessionId=${sessionId}&token=${token}`)
    ws.current = socket
    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onmessage = e => { try { cbRef.current?.(JSON.parse(e.data)) } catch {} }
    const ping = setInterval(() => socket.readyState === 1 && socket.send(JSON.stringify({ type: 'ping' })), 25000)
    return () => { clearInterval(ping); socket.close() }
  }, [sessionId])

  const send = useCallback(msg => {
    if (ws.current?.readyState === 1) ws.current.send(JSON.stringify(msg))
  }, [])

  return { send, connected }
}
