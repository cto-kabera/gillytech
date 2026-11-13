function isoFromOffset(shownIso, offsetMs) {
  if (shownIso == null || offsetMs == null) return null
  const t = new Date(shownIso).getTime()
  if (!Number.isFinite(t)) return null
  return new Date(t + Number(offsetMs)).toISOString()
}

export function scoreBreakdown(sub) {
  const reasoning = (sub.reasoning_text || '').trim()
  const base = sub.is_correct ? 8 : 0
  const firstCorrectBonus = sub.is_first_correct ? 2 : 0
  const reasoningBonus = reasoning.length > 20 ? 2 : 0
  return {
    base,
    firstCorrectBonus,
    reasoningBonus,
    total: sub.score ?? Math.min(12, base + firstCorrectBonus + reasoningBonus)
  }
}

export function toHistoryEntry(sub) {
  const timing = sub.timing || {}
  const shown = timing.questionShownAt || null
  const options = sub.options_json || sub.questions?.content_json?.options || []
  const questionText = sub.question_text || sub.questions?.content_json?.text || ''
  const correctAnswer = sub.correct_answer_snapshot ?? sub.questions?.correct_answer ?? null
  const session = sub.sessions || {}
  const cls = session.classes || {}
  const subject = cls.subject || null

  const selectedIdx = sub.answer
  const selectedAnswer = Array.isArray(options) && options[Number(selectedIdx)] != null
    ? options[Number(selectedIdx)]
    : String(selectedIdx ?? '')
  const correctLabel = Array.isArray(options) && options[Number(correctAnswer)] != null
    ? options[Number(correctAnswer)]
    : String(correctAnswer ?? '')

  const student = sub.users || {}

  return {
    submissionId: sub.id,
    sessionId: sub.session_id,
    sessionTitle: session.title || 'Session',
    studentId: sub.student_id,
    studentName: student.name || 'Student',
    studentEmail: student.email || null,
    questionId: sub.question_id,
    subject,
    topic: session.title || null,
    questionText,
    options,
    reasoningText: sub.reasoning_text || '',
    reasoningCharCount: (sub.reasoning_text || '').trim().length,
    selectedAnswer,
    correctAnswer: correctLabel,
    isCorrect: Boolean(sub.is_correct),
    isFirstCorrect: Boolean(sub.is_first_correct),
    score: scoreBreakdown(sub),
    submittedAt: sub.created_at,
    timing: {
      questionShownAt: shown,
      firstKeystrokeAt: isoFromOffset(shown, timing.planningLatencyMs),
      answerSelectedAt: isoFromOffset(shown, timing.answerSelectedOffsetMs),
      planningLatencyMs: timing.planningLatencyMs ?? null,
      activeReasoningMs: timing.activeReasoningMs ?? 0,
      totalTimeMs: timing.totalTimeMs ?? null,
      editCount: timing.editCount ?? 0,
      writingProcess: timing.writingProcess || null,
      flags: timing.flags || null
    },
    feedback: sub.feedback ?? null
  }
}

export function toExportRow(entry, { pseudonymised = false } = {}) {
  const wp = entry.timing?.writingProcess || {}
  const flags = entry.timing?.flags || {}
  return {
    submissionId: entry.submissionId,
    studentId: entry.studentId,
    studentName: pseudonymised ? '' : entry.studentName,
    studentEmail: pseudonymised ? '' : entry.studentEmail,
    sessionId: entry.sessionId,
    sessionTitle: entry.sessionTitle,
    subject: entry.subject,
    questionId: entry.questionId,
    questionText: entry.questionText,
    selectedAnswer: entry.selectedAnswer,
    correctAnswer: entry.correctAnswer,
    isCorrect: entry.isCorrect,
    isFirstCorrect: entry.isFirstCorrect,
    reasoningText: entry.reasoningText,
    reasoningCharCount: entry.reasoningCharCount,
    scoreBase: entry.score.base,
    scoreFirstCorrectBonus: entry.score.firstCorrectBonus,
    scoreReasoningBonus: entry.score.reasoningBonus,
    scoreTotal: entry.score.total,
    submittedAt: entry.submittedAt,
    questionShownAt: entry.timing?.questionShownAt,
    planningLatencyMs: entry.timing?.planningLatencyMs,
    activeReasoningMs: entry.timing?.activeReasoningMs,
    totalTimeMs: entry.timing?.totalTimeMs,
    editCount: entry.timing?.editCount,
    keystrokeCount: wp.keystrokeCount ?? '',
    charsTyped: wp.charsTyped ?? '',
    charsDeleted: wp.charsDeleted ?? '',
    pauseCount: wp.pauseCount ?? '',
    longestPauseMs: wp.longestPauseMs ?? '',
    burstCount: wp.burstCount ?? '',
    revisionRatio: wp.revisionRatio ?? '',
    backgrounded: flags.backgrounded ?? '',
    suspectRapid: flags.suspectRapid ?? '',
    clientMarksDropped: flags.clientMarksDropped ?? '',
    feedback: entry.feedback
  }
}

const EMPTY_EXPORT = toExportRow({
  submissionId: '',
  studentId: '',
  studentName: '',
  studentEmail: '',
  sessionId: '',
  sessionTitle: '',
  subject: '',
  questionId: '',
  questionText: '',
  selectedAnswer: '',
  correctAnswer: '',
  isCorrect: '',
  isFirstCorrect: '',
  reasoningText: '',
  reasoningCharCount: '',
  score: { base: '', firstCorrectBonus: '', reasoningBonus: '', total: '' },
  submittedAt: '',
  timing: { writingProcess: {}, flags: {} },
  feedback: null
})

export function rowsToCsv(rows) {
  const headers = Object.keys(rows[0] || EMPTY_EXPORT)
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => csvCell(row[h])).join(','))
  }
  return lines.join('\n')
}

function csvCell(value) {
  if (value == null || value === '') return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
