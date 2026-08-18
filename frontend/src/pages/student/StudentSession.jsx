import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuth } from '../../hooks/useAuth'

const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#be185d','#0f766e']
const avatarColor = name => AVATAR_COLORS[(name||'').charCodeAt(0) % AVATAR_COLORS.length]

function Timer({ seconds, onExpire }) {
  const [rem, setRem] = useState(seconds)
  useEffect(() => {
    const t = setInterval(() => setRem(r => { if (r <= 1) { clearInterval(t); onExpire?.(); return 0 } return r - 1 }), 1000)
    return () => clearInterval(t)
  }, [])
  const pct = (rem / seconds) * 100
  const color = rem < 20 ? 'var(--danger)' : rem < 45 ? 'var(--warning)' : 'var(--success)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 60, height: 4, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 1s linear, background .5s' }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color, fontWeight: 600, minWidth: 36 }}
        className={rem < 20 ? 'pulse' : ''}>
        {Math.floor(rem/60)}:{String(rem%60).padStart(2,'0')}
      </span>
    </div>
  )
}

function GroupChat({ messages, onSend, connected, groupName, myId }) {
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function send(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text); setText('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--white)', borderLeft: '1px solid var(--gray-200)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>{groupName}</div>
          <div style={{ fontSize: 11, color: connected ? 'var(--success)' : 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--gray-300)' }} className={connected ? 'pulse' : ''} />
            {connected ? 'Live' : 'Connecting…'}
          </div>
        </div>
        <span style={{ fontSize: 10, background: 'var(--gray-100)', color: 'var(--gray-500)', padding: '2px 7px', borderRadius: 99, fontWeight: 500 }}>
          Discuss before answering
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: '32px 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            Share your thinking with your group before answering.
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender_id === myId
          return (
            <div key={m.id} className="fade-in" style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {!isMe && <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2, fontWeight: 500 }}>{m.sender_name}</div>}
              <div style={{
                padding: '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isMe ? 'var(--brand)' : 'var(--gray-100)',
                color: isMe ? '#fff' : 'var(--gray-800)', fontSize: 13, lineHeight: 1.5
              }}>{m.message}</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2, textAlign: isMe ? 'right' : 'left' }}>
                {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ padding: '10px 12px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Share your thinking…"
          style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
          disabled={!connected}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(e) }} />
        <button className="btn btn-primary btn-sm" type="submit" disabled={!text.trim() || !connected}>Send</button>
      </form>
    </div>
  )
}

export default function StudentSession() {
  const { id } = useParams()
  const { state: initData } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sessionData] = useState(initData)
  const [state, setState] = useState(null)
  const [messages, setMessages] = useState([])
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [leaderboard, setLeaderboard] = useState(null)
  const [showLb, setShowLb] = useState(false)
  const [phase, setPhase] = useState('reason')
  const [reasoning, setReasoning] = useState('')
  const [selected, setSelected] = useState(null)

  async function loadState() {
    const s = await api.student.state(id)
    setState(s)
    if (s.submitted && s.submission) {
      setResult({ ...s.submission, correct_answer: s.question?.correct_answer, options: s.question?.content_json?.options })
    }
    return s
  }

  async function loadChat(qid) {
    if (!qid) return
    const { messages: msgs } = await api.student.chat(id, qid)
    setMessages(msgs)
  }

  useEffect(() => {
    loadState().then(s => { if (s.question?.id) loadChat(s.question.id) })
    api.student.leaderboard(id).then(setLeaderboard).catch(() => {})
  }, [id])

  const handleWs = useCallback(msg => {
    if (msg.type === 'chat') setMessages(prev => [...prev, msg.message])
    if (msg.type === 'question_advance' || msg.type === 'session_update') {
      setResult(null); setPhase('reason'); setReasoning(''); setSelected(null); setMessages([])
      loadState().then(s => { if (s.question?.id) loadChat(s.question.id) })
    }
  }, [id])

  const { send, connected } = useWebSocket(id, handleWs)

  function sendChat(text) {
    if (!state?.question?.id) return
    send({ type: 'chat', text, questionId: state.question.id })
  }

  async function handleSubmit() {
    if (selected === null) return
    setSubmitting(true)
    try {
      const res = await api.student.submit(id, { question_id: state.question.id, reasoning_text: reasoning, answer: String(selected) })
      setResult({ ...res.submission, correct_answer: res.correct_answer, is_correct: res.is_correct, is_first_correct: res.is_first_correct, score: res.score, options: res.options })
      api.student.leaderboard(id).then(setLeaderboard).catch(() => {})
    } catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  const q = state?.question
  const group = sessionData?.group
  const groupMates = sessionData?.groupMates || []
  const reasoningOk = reasoning.trim().length > 20

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/student')}>
          <div style={{ width: 28, height: 28, background: 'var(--brand)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚗</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)' }}>Gillytech</span>
        </div>
        <span style={{ color: 'var(--gray-300)' }}>|</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sessionData?.session?.title || 'Live session'}
        </span>
        {q && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge-blue">Q{(state.index||0)+1}/{state.total||'?'}</span>
          {q.time_limit_sec && !result && <Timer key={q.id} seconds={q.time_limit_sec} />}
        </div>}
        {group && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: group.color || 'var(--brand)' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)' }}>{group.name}</span>
            <div style={{ display: 'flex', marginLeft: 2 }}>
              {groupMates.slice(0,3).map(gm => (
                <div key={gm.id} className="avatar avatar-sm" style={{ background: avatarColor(gm.name), marginLeft: -6, border: '2px solid var(--white)', width: 22, height: 22, fontSize: 9 }} title={gm.name}>{gm.avatar}</div>
              ))}
            </div>
          </div>
        )}
        <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, gap: 4 }} onClick={() => { setShowLb(s=>!s); api.student.leaderboard(id).then(setLeaderboard).catch(()=>{}) }}>
          🏆 Scores
        </button>
      </header>

      {/* Leaderboard dropdown */}
      {showLb && leaderboard && (
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 700, margin: '0 auto' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Students</div>
              {leaderboard.individual.slice(0,5).map((s,i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gray-400)', width: 16 }}>#{i+1}</span>
                  <div className="avatar avatar-sm" style={{ background: avatarColor(s.name), width: 22, height: 22, fontSize: 9 }}>{s.avatar}</div>
                  <span style={{ flex: 1, fontWeight: s.id === user?.id ? 600 : 400, color: s.id === user?.id ? 'var(--brand)' : 'var(--gray-800)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--warning)' }}>{s.total}pts</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Groups</div>
              {leaderboard.groups.map((g,i) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gray-400)', width: 16 }}>#{i+1}</span>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: g.id === group?.id ? 600 : 400, color: g.id === group?.id ? 'var(--brand)' : 'var(--gray-800)' }}>{g.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--warning)' }}>{g.total}pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden', minHeight: 0 }}>
        {/* Question area */}
        <div style={{ overflowY: 'auto', padding: '28px 36px' }}>
          <div style={{ maxWidth: 620 }}>
            {!q && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Waiting for your teacher…</div>
                <div style={{ fontSize: 13 }}>The session will begin shortly.</div>
              </div>
            )}

            {/* Active question — no submission yet */}
            {q && !result && (
              <div className="fade-up">
                {/* Phase tabs */}
                <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--gray-200)', marginBottom: 20, fontSize: 13 }}>
                  {['reason','answer'].map((p, i) => (
                    <div key={p} style={{
                      flex: 1, padding: '10px', textAlign: 'center', fontWeight: 500,
                      background: phase === p ? (p==='reason' ? 'var(--warning-bg)' : 'var(--success-bg)') : 'var(--gray-50)',
                      color: phase === p ? (p==='reason' ? 'var(--warning)' : 'var(--success)') : 'var(--gray-400)',
                      borderRight: i===0 ? '1px solid var(--gray-200)' : 'none', transition: 'all .2s'
                    }}>
                      {p === 'reason' ? '① Explain your thinking' : '② Select your answer'}
                    </div>
                  ))}
                </div>

                {/* Question text */}
                <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderLeft: '3px solid var(--brand)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: 22, fontSize: 15, lineHeight: 1.75, color: 'var(--gray-800)' }}>
                  {q.content_json?.text}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <span className="badge badge-blue">Q{(state.index||0)+1}</span>
                  <span className="badge badge-amber">{q.marks} marks</span>
                  <span className="badge badge-gray">{q.type?.replace('_',' ')}</span>
                </div>

                {/* Phase 1: Reasoning */}
                {phase === 'reason' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Explain your reasoning before answering</label>
                      <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} autoFocus
                        placeholder="What do you think the answer is and why? Use scientific vocabulary. Discuss with your group first…"
                        style={{ minHeight: 120 }} />
                      <div className="form-hint" style={{ color: reasoningOk ? 'var(--success)' : 'var(--gray-400)' }}>
                        {reasoningOk ? '✓ Good — you can now proceed to answer' : `Keep going — ${Math.max(0, 21-reasoning.trim().length)} more characters needed`}
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setPhase('answer')} disabled={!reasoningOk}>
                      Proceed to answer →
                    </button>
                    <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 10 }}>
                      💬 Use the group chat to discuss before deciding
                    </p>
                  </div>
                )}

                {/* Phase 2: Answer */}
                {phase === 'answer' && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 10 }}>Select the best answer:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {(q.content_json?.options||[]).map((opt, i) => (
                        <button key={i} onClick={() => setSelected(i)} style={{
                          textAlign: 'left', padding: '14px 16px', borderRadius: 'var(--radius-lg)',
                          border: selected===i ? '2px solid var(--brand)' : '1.5px solid var(--gray-200)',
                          background: selected===i ? 'var(--brand-light)' : 'var(--white)',
                          display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', transition: 'all .15s',
                          font: 'inherit', fontSize: 14, lineHeight: 1.5, color: 'var(--gray-800)'
                        }}>
                          <span style={{
                            flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                            border: selected===i ? 'none' : '1.5px solid var(--gray-300)',
                            background: selected===i ? 'var(--brand)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: selected===i ? '#fff' : 'var(--gray-400)'
                          }}>{String.fromCharCode(65+i)}</span>
                          {opt}
                        </button>
                      ))}
                    </div>

                    {reasoning && (
                      <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                        <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Your reasoning</div>
                        <div style={{ color: 'var(--gray-700)', lineHeight: 1.6 }}>{reasoning}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPhase('reason')}>← Edit reasoning</button>
                      <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={selected===null||submitting}>
                        {submitting ? <span className="spinner spin" /> : 'Submit answer →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Result */}
            {q && result && (
              <div className="fade-up">
                <div style={{
                  padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: 20,
                  background: result.is_correct ? 'var(--success-bg)' : 'var(--danger-bg)',
                  border: `1.5px solid ${result.is_correct ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  display: 'flex', alignItems: 'center', gap: 16
                }}>
                  <div style={{ fontSize: 40 }}>{result.is_correct ? '🎯' : '❌'}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: result.is_correct ? 'var(--success)' : 'var(--danger)' }}>
                      {result.is_correct ? 'Correct!' : 'Not quite'}
                      {result.is_first_correct && <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--warning)' }}>⚡ First correct — bonus!</span>}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 3 }}>
                      You earned <strong style={{ fontFamily: 'var(--mono)', color: 'var(--brand)' }}>{result.score} pts</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Answer', val: result.is_correct ? '+8' : '+0', ok: result.is_correct },
                    { label: 'Reasoning', val: (reasoning||result.reasoning_text||'').trim().length>20 ? '+2' : '+0', ok: (reasoning||result.reasoning_text||'').trim().length>20 },
                    { label: 'First correct', val: result.is_first_correct ? '+2' : '+0', ok: result.is_first_correct },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: s.ok ? 'var(--success)' : 'var(--gray-400)' }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Correct answer</div>
                  {(result.options||q.content_json?.options||[]).map((opt,i) => {
                    const isCorrect = String(i)===String(result.correct_answer)
                    const wasSelected = String(i)===String(result.answer)
                    return (
                      <div key={i} style={{
                        padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 6,
                        border: `1px solid ${isCorrect ? 'var(--success-border)' : 'var(--gray-200)'}`,
                        background: isCorrect ? 'var(--success-bg)' : 'var(--white)',
                        color: isCorrect ? 'var(--success)' : wasSelected ? 'var(--danger)' : 'var(--gray-500)',
                        fontSize: 13, display: 'flex', gap: 10
                      }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65+i)}{isCorrect?' ✓':wasSelected?' ✗':''}</span>
                        {opt}
                      </div>
                    )
                  })}
                </div>

                <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Your reasoning (saved)</div>
                  <div style={{ color: 'var(--gray-700)', lineHeight: 1.6 }}>{result.reasoning_text || reasoning || '—'}</div>
                </div>

                <div style={{ textAlign: 'center', padding: '20px 0 0', color: 'var(--gray-400)', fontSize: 13 }}>
                  ⏳ Waiting for teacher to advance to the next question…
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <GroupChat messages={messages} onSend={sendChat} connected={connected} groupName={group?.name || 'Group Chat'} myId={user?.id} />
      </div>
    </div>
  )
}
