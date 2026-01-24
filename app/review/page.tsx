'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useSessionStore } from '@/lib/store/sessionStore'
import type { Session, UnderstandingLevel } from '@/lib/types/session'
import { computeReviewAt } from '@/lib/utils/review'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function getDifficultyLabel(difficulty: string): string {
  const d = difficulty.toLowerCase()
  if (d === 'easy') return '쉬움'
  if (d === 'medium') return '보통'
  if (d === 'hard') return '어려움'
  return difficulty
}

function getUnderstandingLabel(level: UnderstandingLevel): string {
  if (level === 'SURFACE') return 'SURFACE'
  if (level === 'PARTIAL') return 'PARTIAL'
  if (level === 'FULL') return 'FULL'
  return level
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const reviewDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = reviewDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '내일'
  if (diffDays === 2) return '모레'
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}일 후`
  
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function getStatusLine(session: Session): string {
  // a) If judge exists: "Last judge: {verdict} ({confidence})"
  if (session.judge) {
    const verdictMap: Record<string, string> = {
      'PASS': '통과',
      'FAIL': '실패',
      'TLE_RISK': '시간 초과 위험',
      'LIKELY_PASS': '통과 가능',
      'POSSIBLY_FAIL': '실패 가능'
    }
    const verdict = verdictMap[session.judge.verdict] || session.judge.verdict
    const confidence = session.judge.confidence !== undefined 
      ? `${session.judge.confidence}/5`
      : 'N/A'
    return `Last judge: ${verdict} (${confidence})`
  }
  
  // b) Else if understandingLevel exists: "Understanding: {SURFACE|PARTIAL|FULL}"
  if (session.understandingLevel) {
    return `Understanding: ${getUnderstandingLabel(session.understandingLevel)}`
  }
  
  // c) Else: "No submission yet"
  return 'No submission yet'
}

export default function ReviewPage() {
  const getTodayReviews = useSessionStore((s) => s.getTodayReviews)
  const getUpcomingReviews = useSessionStore((s) => s.getUpcomingReviews)
  const updateSession = useSessionStore((s) => s.updateSession)
  
  const [showListView, setShowListView] = useState(false)
  const [showRecall, setShowRecall] = useState(false)
  const [recallText, setRecallText] = useState('')
  const [showLastNotes, setShowLastNotes] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [justMarkedDone, setJustMarkedDone] = useState(false)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  
  const now = useMemo(() => new Date(), [])
  const todaySessions = useMemo(() => getTodayReviews(now), [getTodayReviews, now])
  const upcomingSessions = useMemo(() => getUpcomingReviews(now), [getUpcomingReviews, now])
  
  const firstDueSession = todaySessions.length > 0 ? todaySessions[0] : null
  
  // Reset recall when session changes
  useEffect(() => {
    if (firstDueSession) {
      setShowRecall(false)
      setRecallText('')
      setShowLastNotes(false)
      setJustMarkedDone(false)
    }
  }, [firstDueSession?.id])
  
  const handleStartReview = () => {
    setShowRecall(true)
  }
  
  const handleMarkDone = async () => {
    if (!firstDueSession) return
    
    setMarkingDone(true)
    
    // Set reviewedAt to now
    const nowISO = new Date().toISOString()
    
    // Auto-reschedule next reviewAt based on understandingLevel
    let nextReviewAt: string
    if (firstDueSession.understandingLevel) {
      nextReviewAt = computeReviewAt(firstDueSession.understandingLevel)
    } else {
      // Default +3 days if understandingLevel missing
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 3)
      nextReviewAt = defaultDate.toISOString()
    }
    
    updateSession(firstDueSession.id, {
      reviewedAt: nowISO,
      reviewAt: nextReviewAt,
    })
    
    setMarkingDone(false)
    setJustMarkedDone(true)
    
    // Clear recall
    setShowRecall(false)
    setRecallText('')
    
    // After a brief moment, the next item will load automatically via useMemo
    setTimeout(() => {
      setJustMarkedDone(false)
    }, 2000)
  }
  
  const handleShowLastNotes = () => {
    if (firstDueSession?.understandingAnswers) {
      const notes = [
        firstDueSession.understandingAnswers.q1,
        firstDueSession.understandingAnswers.q2,
        firstDueSession.understandingAnswers.q3,
      ].filter(Boolean).join('\n\n')
      setRecallText(notes)
      setShowLastNotes(true)
    }
  }
  
  // Empty state
  if (todaySessions.length === 0 && !showListView) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
            <div className="mb-8 md:mb-10">
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
                복습
              </h1>
            </div>
            
            <Card className="text-center py-12">
              <p className="text-text-muted text-sm mb-6">
                Nothing due today.
              </p>
              <Link href="/start">
                <Button variant="primary" size="lg" className="mb-4">
                  Start a session
                </Button>
              </Link>
              {upcomingSessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowListView(true)}
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  View queue
                </button>
              )}
            </Card>
            
            {upcomingSessions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-text-primary mb-4">
                  Upcoming
                </h2>
                <div className="space-y-3">
                  {upcomingSessions.slice(0, showAllUpcoming ? undefined : 3).map((session) => (
                    <Card key={session.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-text-primary mb-1">
                            {session.problem.title}
                          </h3>
                          <p className="text-xs text-text-muted mb-2">
                            {session.problem.platform} • {getDifficultyLabel(session.problem.difficulty)} • {session.problem.tags.slice(0, 2).join(', ')}
                          </p>
                          <p className="text-xs text-text-muted">
                            {session.reviewAt && formatDate(session.reviewAt)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                {!showAllUpcoming && upcomingSessions.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllUpcoming(true)}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors mt-3"
                  >
                    See all ({upcomingSessions.length} total)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    )
  }
  
  // Workbench mode (default)
  if (!showListView && firstDueSession) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
            <div className="mb-8 md:mb-10">
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
                복습
              </h1>
            </div>
            
            {/* Active Review Card */}
            <Card className="mb-6">
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <h2 className="text-xl font-semibold text-text-primary mb-2">
                    {firstDueSession.problem.title}
                  </h2>
                  <p className="text-xs text-text-muted mb-2">
                    {firstDueSession.problem.platform} • {getDifficultyLabel(firstDueSession.problem.difficulty)} • {firstDueSession.problem.tags.slice(0, 3).join(', ')}
                  </p>
                  <p className="text-xs text-text-muted mb-2">
                    {getStatusLine(firstDueSession)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {firstDueSession.reviewAt && (
                      <>
                        Due: {formatDate(firstDueSession.reviewAt) === '오늘' ? 'Due today' : formatDate(firstDueSession.reviewAt)}
                      </>
                    )}
                  </p>
                </div>
                
                {/* Recall Textarea (shown when Start review clicked) */}
                {showRecall && (
                  <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                    <textarea
                      value={recallText}
                      onChange={(e) => setRecallText(e.target.value)}
                      placeholder="Explain your approach in 3–5 sentences…"
                      className={cn(
                        'w-full min-h-[120px] px-4 py-3 rounded-[10px]',
                        'bg-background-tertiary border border-[rgba(255,255,255,0.06)]',
                        'text-sm text-text-primary placeholder:text-text-muted',
                        'focus:outline-none focus:border-[rgba(62,207,142,0.3)]',
                        'resize-none'
                      )}
                    />
                    {!showLastNotes && firstDueSession.understandingAnswers && (
                      <button
                        type="button"
                        onClick={handleShowLastNotes}
                        className="text-xs text-text-muted hover:text-text-primary transition-colors"
                      >
                        Show my last notes
                      </button>
                    )}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  {!showRecall ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartReview}
                      className="flex-1"
                    >
                      Start review
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleMarkDone}
                      disabled={markingDone}
                      className="flex-1"
                    >
                      {markingDone ? 'Marking...' : 'Mark done'}
                    </Button>
                  )}
                </div>
                
                {justMarkedDone && (
                  <div className="text-xs text-[#35c082] pt-2">
                    ✓ Review completed. Loading next item...
                  </div>
                )}
              </div>
            </Card>
            
            {/* View Queue Link */}
            <button
              type="button"
              onClick={() => setShowListView(true)}
              className="text-sm text-text-muted hover:text-text-primary transition-colors mb-8"
            >
              View queue
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }
  
  // List view
  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
          <div className="mb-8 md:mb-10 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
              복습
            </h1>
            <button
              type="button"
              onClick={() => setShowListView(false)}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Back to workbench
            </button>
          </div>
          
          {/* Today List */}
          {todaySessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-text-primary mb-4">
                Today
              </h2>
              <div className="space-y-3">
                {todaySessions.map((session) => (
                  <Card key={session.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-text-primary mb-1">
                          {session.problem.title}
                        </h3>
                        <p className="text-xs text-text-muted mb-1">
                          {session.problem.platform} • {getDifficultyLabel(session.problem.difficulty)} • {session.problem.tags.slice(0, 2).join(', ')}
                        </p>
                        <p className="text-xs text-text-muted">
                          {getStatusLine(session)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Upcoming List */}
          {upcomingSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-text-primary mb-4">
                Upcoming
              </h2>
              <div className="space-y-3">
                {(showAllUpcoming ? upcomingSessions : upcomingSessions.slice(0, 3)).map((session) => (
                  <Card key={session.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-text-primary mb-1">
                          {session.problem.title}
                        </h3>
                        <p className="text-xs text-text-muted mb-1">
                          {session.problem.platform} • {getDifficultyLabel(session.problem.difficulty)} • {session.problem.tags.slice(0, 2).join(', ')}
                        </p>
                        <p className="text-xs text-text-muted">
                          {session.reviewAt && formatDate(session.reviewAt)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                {!showAllUpcoming && upcomingSessions.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllUpcoming(true)}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors text-center w-full py-2"
                  >
                    See all ({upcomingSessions.length} total)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
