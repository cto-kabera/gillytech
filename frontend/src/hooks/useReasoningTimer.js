import { useCallback, useEffect, useRef } from 'react'

const IDLE_GAP_MS = 3000
const PAUSE_MS = 2000

export function useReasoningTimer(questionId) {
  const shownAtPerf = useRef(performance.now())
  const firstKeystroke = useRef(null)
  const answerSelected = useRef(null)
  const lastEdit = useRef(null)
  const activeMs = useRef(0)
  const lastTypeAt = useRef(null)
  const editCount = useRef(0)
  const prevLen = useRef(0)
  const backgrounded = useRef(false)

  const keystrokeCount = useRef(0)
  const charsTyped = useRef(0)
  const charsDeleted = useRef(0)
  const pauseCount = useRef(0)
  const longestPauseMs = useRef(0)
  const burstCount = useRef(0)
  const unlockAttempts = useRef(0)
  const placeholderAttempts = useRef(0)
  const optionChanges = useRef(0)

  useEffect(() => {
    shownAtPerf.current = performance.now()
    firstKeystroke.current = null
    answerSelected.current = null
    lastEdit.current = null
    activeMs.current = 0
    lastTypeAt.current = null
    editCount.current = 0
    prevLen.current = 0
    backgrounded.current = false
    keystrokeCount.current = 0
    charsTyped.current = 0
    charsDeleted.current = 0
    pauseCount.current = 0
    longestPauseMs.current = 0
    burstCount.current = 0
    unlockAttempts.current = 0
    placeholderAttempts.current = 0
    optionChanges.current = 0
  }, [questionId])

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) backgrounded.current = true
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const onReasoningChange = useCallback((value) => {
    const now = performance.now()
    if (firstKeystroke.current === null) {
      firstKeystroke.current = now - shownAtPerf.current
      burstCount.current = 1
    }

    if (lastTypeAt.current !== null) {
      const gap = now - lastTypeAt.current
      if (gap <= IDLE_GAP_MS) activeMs.current += gap
      if (gap > PAUSE_MS) {
        pauseCount.current += 1
        burstCount.current += 1
        if (gap > longestPauseMs.current) longestPauseMs.current = gap
      }
    }
    lastTypeAt.current = now
    lastEdit.current = now - shownAtPerf.current

    const delta = value.length - prevLen.current
    if (delta > 0) charsTyped.current += delta
    else if (delta < 0) {
      charsDeleted.current += -delta
      editCount.current += 1
    }
    keystrokeCount.current += Math.max(1, Math.abs(delta))
    prevLen.current = value.length
  }, [])

  const onAnswerSelected = useCallback(() => {
    if (answerSelected.current !== null) optionChanges.current += 1
    answerSelected.current = performance.now() - shownAtPerf.current
  }, [])

  const onUnlockAttempt = useCallback((reasoningLength) => {
    unlockAttempts.current += 1
    if (reasoningLength < 21) placeholderAttempts.current += 1
  }, [])

  const collectHci = useCallback((extras = {}) => ({
    unlockAttemptsBeforeValid: unlockAttempts.current,
    placeholderAttempts: placeholderAttempts.current,
    optionChanges: optionChanges.current,
    stanceRevisions: optionChanges.current > 0 ? 1 : 0,
    messagesSent: extras.messagesSent ?? 0,
    groupSharePct: extras.groupSharePct ?? null,
    turnTakingIndex: extras.turnTakingIndex ?? null,
    perceivedSyncDelayMs: extras.perceivedSyncDelayMs ?? null,
    submitRetries: extras.submitRetries ?? 0,
    prePostDiscussionAligned: extras.prePostDiscussionAligned ?? null,
    reasoningMatchesAnswer: extras.reasoningMatchesAnswer ?? null
  }), [])

  const collect = useCallback(() => ({
    firstKeystrokeOffsetMs: firstKeystroke.current === null ? null : Math.round(firstKeystroke.current),
    answerSelectedOffsetMs: answerSelected.current === null ? null : Math.round(answerSelected.current),
    lastEditOffsetMs: lastEdit.current === null ? null : Math.round(lastEdit.current),
    activeReasoningMs: Math.round(activeMs.current),
    editCount: editCount.current,
    keystrokeCount: keystrokeCount.current,
    charsTyped: charsTyped.current,
    charsDeleted: charsDeleted.current,
    pauseCount: pauseCount.current,
    longestPauseMs: Math.round(longestPauseMs.current),
    burstCount: burstCount.current,
    wasBackgrounded: backgrounded.current,
    clientSubmittedAtIso: new Date().toISOString()
  }), [])

  return { onReasoningChange, onAnswerSelected, onUnlockAttempt, collect, collectHci }
}
