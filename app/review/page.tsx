'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

function formatLastSolved(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const solvedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = today.getTime() - solvedDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}일 전`
  
  // Format: 1/27
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'BOJ': return 'text-blue-400'
    case 'LeetCode': return 'text-orange-400'
    case 'Programmers': return 'text-purple-400'
    default: return 'text-text-muted'
  }
}

function getDifficultyColor(difficulty: string): string {
  const lower = difficulty.toLowerCase()
  if (lower === 'easy') return 'text-green-400'
  if (lower === 'medium') return 'text-yellow-400'
  if (lower === 'hard') return 'text-red-400'
  return 'text-text-muted'
}

function getStatusLine(session: Session): string {
  // a) If judge exists: "마지막 채점: {verdict} ({confidence})"
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
    return `마지막 채점: ${verdict} (${confidence})`
  }
  
  // b) Else if understandingLevel exists: "이해도: {SURFACE|PARTIAL|FULL}"
  if (session.understandingLevel) {
    return `이해도: ${getUnderstandingLabel(session.understandingLevel)}`
  }
  
  // c) Else: "아직 제출 없음"
  return '아직 제출 없음'
}

function ReviewPageContent() {
  const searchParams = useSearchParams()
  const isDevMode = searchParams?.get('dev') === 'true'
  
  const getTodayReviews = useSessionStore((s) => s.getTodayReviews)
  const getUpcomingReviews = useSessionStore((s) => s.getUpcomingReviews)
  const updateSession = useSessionStore((s) => s.updateSession)
  const createSession = useSessionStore((s) => s.createSession)
  const sessions = useSessionStore((s) => s.sessions)
  
  const [showListView, setShowListView] = useState(false)
  const [showRecall, setShowRecall] = useState(false)
  const [recallText, setRecallText] = useState('')
  const [showLastNotes, setShowLastNotes] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [justMarkedDone, setJustMarkedDone] = useState(false)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const [devSessionCreated, setDevSessionCreated] = useState(false)
  
  const now = useMemo(() => new Date(), [])
  
  // Dev mode: Create test session if needed
  useEffect(() => {
    if (isDevMode && !devSessionCreated) {
      const todaySessions = getTodayReviews(now)
      if (todaySessions.length === 0) {
        // Create test session
        const testProblem = {
          id: 'dev-test-problem-' + Date.now(),
          title: 'Two Sum',
          platform: 'LeetCode',
          difficulty: 'medium',
          tags: ['Array', 'Hash Table'],
          url: 'https://leetcode.com/problems/two-sum/',
        }
        
        const sessionId = createSession(testProblem)
        const todayReviewAt = new Date(now)
        todayReviewAt.setHours(0, 0, 0, 0)
        
        updateSession(sessionId, {
          understandingAnswers: {
            q1: '해시 테이블을 사용하여 각 숫자와 인덱스를 저장하고, 목표값에서 현재 숫자를 뺀 값이 해시 테이블에 있는지 확인하는 방식으로 해결했습니다.',
            q2: '시간 복잡도는 O(n), 공간 복잡도는 O(n)입니다. 배열을 한 번 순회하면서 해시 테이블에 저장하고 조회하기 때문입니다.',
            q3: '중복된 숫자가 있을 수 있지만, 해시 테이블의 마지막 인덱스가 저장되므로 문제없습니다. 빈 배열이나 요소가 2개 미만인 경우는 제약 조건에서 처리됩니다.',
          },
          understandingLevel: 'PARTIAL',
          reviewAt: todayReviewAt.toISOString(),
          status: 'SCHEDULED',
          judge: {
            verdict: 'PASS',
            confidence: 4,
            reasons: ['모든 테스트 케이스를 통과했습니다'],
            createdAt: new Date().toISOString(),
          },
        })
        
        setDevSessionCreated(true)
      }
    }
  }, [isDevMode, devSessionCreated, now, getTodayReviews, createSession, updateSession])
  
  const todaySessions = useMemo(() => getTodayReviews(now), [getTodayReviews, now, sessions])
  const upcomingSessions = useMemo(() => getUpcomingReviews(now), [getUpcomingReviews, now, sessions])
  
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
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
            <div className="mb-8 md:mb-10">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
                  복습
                </h1>
                {isDevMode && (
                  <Badge variant="muted" className="text-xs">
                    개발자 모드
                  </Badge>
                )}
              </div>
              {isDevMode && (
                <p className="text-xs text-text-muted mt-2">
                  개발자 모드가 활성화되었습니다. 테스트용 복습 항목이 자동으로 생성됩니다.
                </p>
              )}
            </div>
            
            <Card className="text-center py-12">
              <p className="text-text-muted text-sm mb-6">
                오늘 복습할 항목이 없어요.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Link href="/start">
                  <Button variant="primary" size="lg">
                    세션 시작하기
                  </Button>
                </Link>
                {upcomingSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowListView(true)}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    대기 목록 보기
                  </button>
                )}
              </div>
            </Card>
            
            {upcomingSessions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-text-primary mb-4">
                  예정된 복습
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
                    전체 보기 ({upcomingSessions.length}개)
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
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
            <div className="mb-8 md:mb-10">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
                  복습
                </h1>
                {isDevMode && (
                  <Badge variant="muted" className="text-xs">
                    개발자 모드
                  </Badge>
                )}
              </div>
              {isDevMode && (
                <p className="text-xs text-text-muted mt-2">
                  개발자 모드가 활성화되었습니다. 테스트용 복습 항목이 표시됩니다.
                </p>
              )}
            </div>
            
            {/* Active Review Card */}
            <Card className="mb-6">
              <div className="space-y-4">
                {/* Header Row: Title + CTA Button */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <h2 className="text-xl font-semibold text-text-primary flex-1 min-w-0">
                    {firstDueSession.problem.title}
                  </h2>
                  {!showRecall ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleStartReview}
                      className="w-full sm:w-auto sm:flex-shrink-0 min-w-[140px] sm:min-w-[160px]"
                    >
                      복습 시작
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleMarkDone}
                      disabled={markingDone}
                      className="w-full sm:w-auto sm:flex-shrink-0 min-w-[140px] sm:min-w-[160px]"
                    >
                      {markingDone ? '처리 중...' : '완료하기'}
                    </Button>
                  )}
                </div>

                {/* Second Row: Platform • Difficulty + Tag Chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-xs font-medium', getPlatformColor(firstDueSession.problem.platform))}>
                    {firstDueSession.problem.platform}
                  </span>
                  <span className="text-text-muted text-xs">•</span>
                  <span className={cn('text-xs font-medium', getDifficultyColor(firstDueSession.problem.difficulty))}>
                    {getDifficultyLabel(firstDueSession.problem.difficulty)}
                  </span>
                  {firstDueSession.problem.tags && firstDueSession.problem.tags.length > 0 && (
                    <>
                      <span className="text-text-muted text-xs">•</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {firstDueSession.problem.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="muted"
                            className="text-[10px] py-0.5 px-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-background-secondary"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-[rgba(255,255,255,0.06)]"></div>

                {/* Third Row: Last Solved + Last Judge | Due Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    {/* Last Solved - Emphasized */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-text-muted">마지막 풀이:</span>
                      <span className="text-sm font-medium text-text-primary">
                        {(() => {
                          const lastSolvedDate = firstDueSession.reviewedAt || firstDueSession.createdAt
                          if (!lastSolvedDate) return 'N/A'
                          const formatted = formatLastSolved(lastSolvedDate)
                          // If it's a relative date (오늘, 어제, N일 전), show it as is
                          // Otherwise show the date format
                          return formatted
                        })()}
                      </span>
                    </div>
                    {/* Last Judge - Less prominent */}
                    {getStatusLine(firstDueSession) !== '아직 제출 없음' && (
                      <p className="text-xs text-text-muted">
                        {getStatusLine(firstDueSession)}
                      </p>
                    )}
                  </div>
                  {/* Due Badge */}
                  {firstDueSession.reviewAt && (
                    <Badge
                      variant="muted"
                      className="text-xs self-start sm:self-auto"
                    >
                      {formatDate(firstDueSession.reviewAt) === '오늘' ? '오늘 복습' : `복습 예정: ${formatDate(firstDueSession.reviewAt)}`}
                    </Badge>
                  )}
                </div>
                
                {/* Recall Textarea (shown when Start review clicked) */}
                {showRecall && (
                  <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                    <textarea
                      value={recallText}
                      onChange={(e) => setRecallText(e.target.value)}
                      placeholder="접근 방법을 3-5문장으로 설명해주세요…"
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
                        이전 노트 보기
                      </button>
                    )}
                  </div>
                )}
                
                {justMarkedDone && (
                  <div className="text-xs text-[#35c082] pt-2">
                    ✓ 복습 완료. 다음 항목 불러오는 중...
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
              대기 목록 보기
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
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
          <div className="mb-8 md:mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
                복습
              </h1>
              {isDevMode && (
                <Badge variant="muted" className="text-xs">
                  개발자 모드
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowListView(false)}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              작업대로 돌아가기
            </button>
          </div>
          
          {/* Today List */}
          {todaySessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-text-primary mb-4">
                오늘
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
                예정된 복습
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
                    전체 보기 ({upcomingSessions.length}개)
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

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
            <div className="mb-8 md:mb-10">
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
                복습
              </h1>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    }>
      <ReviewPageContent />
    </Suspense>
  )
}
