import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeSession({ sessionId, groupId, isStaff, onEvent }) {
  const [connected, setConnected] = useState(false)
  const cbRef = useRef(onEvent)
  cbRef.current = onEvent

  useEffect(() => {
    if (!sessionId) return

    const channel = supabase.channel(`session:${sessionId}`)

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
      payload => cbRef.current?.({ type: 'session_update', session: payload.new })
    )

    if (groupId) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${groupId}` },
        payload => cbRef.current?.({ type: 'chat', message: payload.new })
      )
    } else if (isStaff) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
        payload => cbRef.current?.({ type: 'chat', message: payload.new })
      )
    }

    if (isStaff) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions', filter: `session_id=eq.${sessionId}` },
        payload => cbRef.current?.({ type: 'submission', submission: payload.new })
      )
    }

    channel.subscribe(status => {
      setConnected(status === 'SUBSCRIBED')
    })

    return () => {
      setConnected(false)
      supabase.removeChannel(channel)
    }
  }, [sessionId, groupId, isStaff])

  return { connected }
}
