const RAPID_THRESHOLD_MS = 4000
const MAX_PLAUSIBLE_MS = 45 * 60 * 1000
const SKEW_TOLERANCE_MS = 1000

export function deriveTiming(questionShownAt, serverNow, client) {
  const shown = new Date(questionShownAt).getTime()
  const submitted = serverNow.getTime()
  const totalTimeMs = clamp(submitted - shown, 0, MAX_PLAUSIBLE_MS)

  const marksValid =
    !!client &&
    (client.firstKeystrokeOffsetMs === null || client.firstKeystrokeOffsetMs >= 0) &&
    Number(client.activeReasoningMs) >= 0 &&
    Number(client.activeReasoningMs) <= totalTimeMs + SKEW_TOLERANCE_MS

  const planningLatencyMs =
    marksValid && client.firstKeystrokeOffsetMs !== null
      ? clamp(client.firstKeystrokeOffsetMs, 0, totalTimeMs)
      : null

  const activeReasoningMs = marksValid
    ? clamp(client.activeReasoningMs, 0, totalTimeMs)
    : 0

  const clientClockSkewMs = marksValid
    ? new Date(client.clientSubmittedAtIso).getTime() - submitted
    : 0

  const writingProcess = marksValid
    ? {
        keystrokeCount: nonNeg(client.keystrokeCount),
        charsTyped: nonNeg(client.charsTyped),
        charsDeleted: nonNeg(client.charsDeleted),
        pauseCount: nonNeg(client.pauseCount),
        longestPauseMs: clamp(client.longestPauseMs, 0, totalTimeMs),
        burstCount: nonNeg(client.burstCount),
        revisionRatio: nonNeg(client.charsDeleted) / Math.max(1, nonNeg(client.charsTyped))
      }
    : {
        keystrokeCount: 0,
        charsTyped: 0,
        charsDeleted: 0,
        pauseCount: 0,
        longestPauseMs: 0,
        burstCount: 0,
        revisionRatio: 0
      }

  return {
    questionShownAt,
    submittedAt: serverNow.toISOString(),
    totalTimeMs,
    planningLatencyMs,
    activeReasoningMs,
    editCount: marksValid ? Number(client.editCount) || 0 : 0,
    answerSelectedOffsetMs: marksValid ? client.answerSelectedOffsetMs ?? null : null,
    lastEditOffsetMs: marksValid ? client.lastEditOffsetMs ?? null : null,
    writingProcess,
    flags: {
      backgrounded: marksValid ? Boolean(client.wasBackgrounded) : false,
      clientClockSkewMs,
      suspectRapid: totalTimeMs < RAPID_THRESHOLD_MS,
      clientMarksDropped: !marksValid
    }
  }
}

function clamp(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.max(lo, Math.min(hi, n))
}

function nonNeg(v) {
  const n = Number(v)
  return n > 0 && n !== Infinity ? n : 0
}
