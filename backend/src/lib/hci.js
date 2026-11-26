/** Build per-submission HCI snapshot from timing + optional client marks. */
export function buildSubmissionHci({
  timing,
  clientHci,
  reasoningText,
  isCorrect,
  reasoningMatchesAnswer
}) {
  const wp = timing?.writingProcess || {}
  const words = (reasoningText || '').trim().split(/\s+/).filter(Boolean).length
  const client = clientHci || {}

  return {
    stages: {
      preAnswerReasoning: {
        draftTimeMs: timing?.activeReasoningMs ?? null,
        planningLatencyMs: timing?.planningLatencyMs ?? null,
        wordCount: words,
        editBursts: wp.burstCount ?? 0,
        backspaceBursts: wp.charsDeleted ?? 0,
        placeholderAttempts: client.placeholderAttempts ?? 0,
        unlockAttemptsBeforeValid: client.unlockAttemptsBeforeValid ?? 0
      },
      groupDiscussion: {
        messagesSent: client.messagesSent ?? 0,
        groupSharePct: client.groupSharePct ?? null,
        turnTakingIndex: client.turnTakingIndex ?? null,
        stanceRevisions: client.stanceRevisions ?? 0,
        perceivedSyncDelayMs: client.perceivedSyncDelayMs ?? null
      },
      answerSubmission: {
        firstAttemptCorrect: Boolean(isCorrect),
        optionChangesAfterDiscussion: client.optionChanges ?? 0,
        submitRetries: client.submitRetries ?? 0,
        timeToSubmitMs: timing?.totalTimeMs ?? null
      }
    },
    alignment: {
      reasoningMatchesAnswer: reasoningMatchesAnswer ?? null,
      prePostDiscussionAligned: client.prePostDiscussionAligned ?? null
    },
    flags: {
      suspectRapid: timing?.flags?.suspectRapid ?? false,
      backgrounded: timing?.flags?.backgrounded ?? false
    }
  }
}

function avg(nums) {
  const v = nums.filter(n => n != null && Number.isFinite(n))
  if (!v.length) return null
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length)
}

export function aggregateHciDashboard({ submissions, surveys, sessions }) {
  const subs = submissions || []
  const stage1 = subs.map(s => s.hci?.stages?.preAnswerReasoning).filter(Boolean)
  const stage2 = subs.map(s => s.hci?.stages?.groupDiscussion).filter(Boolean)
  const stage3 = subs.map(s => s.hci?.stages?.answerSubmission).filter(Boolean)

  const seqScores = (surveys || []).map(s => s.seq_score)
  const accuracy = subs.length
    ? Math.round((subs.filter(s => s.is_correct).length / subs.length) * 100)
    : 0

  const learnability = []
  const bySession = new Map()
  for (const s of subs) {
    if (!bySession.has(s.session_id)) bySession.set(s.session_id, [])
    bySession.get(s.session_id).push(s)
  }
  const sessionList = [...bySession.entries()]
    .sort((a, b) => {
      const sa = sessions?.find(x => x.id === a[0])
      const sb = sessions?.find(x => x.id === b[0])
      return new Date(sa?.started_at || 0) - new Date(sb?.started_at || 0)
    })
  sessionList.forEach(([, list], i) => {
    const times = list.map(x => x.hci?.stages?.answerSubmission?.timeToSubmitMs).filter(Number.isFinite)
    learnability.push({
      sessionIndex: i + 1,
      sessionId: list[0]?.session_id,
      avgSubmitMs: avg(times),
      submissionCount: list.length
    })
  })

  return {
    summary: {
      submissionCount: subs.length,
      sessionCount: bySession.size,
      accuracyPct: accuracy,
      avgSeq: seqScores.length ? Math.round((seqScores.reduce((a, b) => a + b, 0) / seqScores.length) * 10) / 10 : null,
      surveyCount: seqScores.length
    },
    stage1: {
      title: 'Pre-answer reasoning',
      dimension: 'Cognitive load & friction',
      metrics: {
        avgDraftTimeMs: avg(stage1.map(x => x.draftTimeMs)),
        avgWordCount: avg(stage1.map(x => x.wordCount)),
        avgEditBursts: avg(stage1.map(x => x.editBursts)),
        totalUnlockAttempts: stage1.reduce((a, x) => a + (x.unlockAttemptsBeforeValid || 0), 0),
        totalPlaceholderAttempts: stage1.reduce((a, x) => a + (x.placeholderAttempts || 0), 0)
      }
    },
    stage2: {
      title: 'Real-time group discussion',
      dimension: 'Collaboration & flow',
      metrics: {
        avgMessagesSent: avg(stage2.map(x => x.messagesSent)),
        avgTurnTakingIndex: avg(stage2.map(x => x.turnTakingIndex)),
        avgStanceRevisions: avg(stage2.map(x => x.stanceRevisions)),
        avgSyncDelayMs: avg(stage2.map(x => x.perceivedSyncDelayMs))
      }
    },
    stage3: {
      title: 'Answer selection & submission',
      dimension: 'Effectiveness & accuracy',
      metrics: {
        firstAttemptAccuracyPct: accuracy,
        avgOptionChanges: avg(stage3.map(x => x.optionChangesAfterDiscussion)),
        totalSubmitRetries: stage3.reduce((a, x) => a + (x.submitRetries || 0), 0)
      }
    },
    stage4: {
      title: 'Post-submission / teacher view',
      dimension: 'Efficiency & trust',
      metrics: {
        avgSeq: seqScores.length ? Math.round((seqScores.reduce((a, b) => a + b, 0) / seqScores.length) * 10) / 10 : null,
        estimatedReviewTimeMsPerSubmission: subs.length ? avg(stage3.map(x => x.timeToSubmitMs)) : null
      }
    },
    learnability,
    bySubmission: subs.map(s => ({
      submissionId: s.id,
      sessionId: s.session_id,
      sessionTitle: s.sessions?.title,
      studentName: s.users?.name,
      studentId: s.student_id,
      hci: s.hci,
      isCorrect: s.is_correct
    }))
  }
}