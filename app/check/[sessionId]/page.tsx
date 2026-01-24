'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSessionStore } from '@/lib/store/sessionStore'
import { computeReviewAt } from '@/lib/utils/review'
import type { Session, JudgeResult, UnderstandingLevel } from '@/lib/types/session'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { cn } from '@/lib/utils'

interface CheckPageProps {
  params: { sessionId: string }
}

const QUESTIONS: { id: 'q1' | 'q2' | 'q3'; text: string }[] = [
  { id: 'q1', text: '핵심 조건/제약은 뭐였고, 그게 풀이를 어떻게 제한했어?' },
  { id: 'q2', text: '왜 이 방식이 성립하는지(정당성/불변식)를 한 문장으로 말해봐.' },
  { id: 'q3', text: '다음에 비슷한 문제면 무엇부터 체크할 거야?' },
]

const LEVELS: { value: UnderstandingLevel; label: string; schedule: string }[] = [
  { value: 'SURFACE', label: '표면 이해', schedule: '+1일' },
  { value: 'PARTIAL', label: '부분 이해', schedule: '+3일' },
  { value: 'FULL', label: '완전 이해', schedule: '+7일' },
]

function getVerdictLabel(verdict: JudgeResult['verdict']): string {
  switch (verdict) {
    case 'LIKELY_PASS': return 'Likely pass'
    case 'POSSIBLY_FAIL': return 'Possible issues'
    case 'TLE_RISK': return 'TLE risk'
    default: return String(verdict)
  }
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

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function CheckPage({ params }: CheckPageProps) {
  const getSession = useSessionStore((s) => s.getSession)
  const setUnderstanding = useSessionStore((s) => s.setUnderstanding)

  const [session, setSession] = useState<Session | undefined>(() =>
    getSession(params.sessionId)
  )
  const [answers, setAnswers] = useState<{ q1: string; q2: string; q3: string }>({
    q1: '',
    q2: '',
    q3: '',
  })
  const [level, setLevel] = useState<UnderstandingLevel | null>(null)
  const [fullPlus14, setFullPlus14] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [reviewAt, setReviewAt] = useState<string | null>(null)

  useEffect(() => {
    const s = getSession(params.sessionId)
    setSession(s)
    if (s?.understandingAnswers) {
      setAnswers({
        q1: s.understandingAnswers.q1,
        q2: s.understandingAnswers.q2,
        q3: s.understandingAnswers.q3,
      })
    }
    if (s?.understandingLevel) {
      setLevel(s.understandingLevel)
    }
  }, [params.sessionId, getSession])

  const allAnswered = QUESTIONS.every((q) => (answers[q.id] || '').trim().length > 0)
  const canSubmit = allAnswered && level !== null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !canSubmit || !level) return

    const use14 = level === 'FULL' && fullPlus14
    const nextReviewAt = computeReviewAt(level, use14)

    setUnderstanding(session.id, answers, level, nextReviewAt)
    setReviewAt(nextReviewAt)
    setConfirmed(true)
  }

  const handleEditAnswers = () => {
    const updated = getSession(params.sessionId)
    if (updated) {
      setSession(updated)
      if (updated.understandingAnswers) {
        setAnswers(updated.understandingAnswers)
      }
      if (updated.understandingLevel) {
        setLevel(updated.understandingLevel)
      }
      setFullPlus14(false)
    }
    setConfirmed(false)
  }

  if (!session) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen pb-20 md:pb-0 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 text-center">
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-text-primary">
                세션을 찾을 수 없어요
              </h2>
              <p className="text-sm text-text-muted">
                이 세션이 없거나 삭제되었을 수 있어요.
              </p>
              <Link href="/start">
                <Button variant="primary" size="lg" className="w-full">
                  Start a session
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (confirmed && reviewAt) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen pb-24 md:pb-0">
          <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
            <PageHeader
              title="이해도 확인"
              description="답변이 저장되었어요"
            />
            <Card className="space-y-6">
              <p className="text-base text-text-primary">
                Review scheduled for{' '}
                <span className="font-medium text-accent">{formatReviewDate(reviewAt)}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/review" className="flex-1 sm:flex-none">
                  <Button variant="primary" size="lg" className="w-full">
                    Go to Review
                  </Button>
                </Link>
                <Link href="/home" className="flex-1 sm:flex-none">
                  <Button variant="secondary" size="lg" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
              <button
                type="button"
                onClick={handleEditAnswers}
                className="text-sm text-text-muted hover:text-accent transition-colors"
              >
                Edit answers
              </button>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
          <PageHeader
            title="이해도 확인"
            description="풀이 이해도를 스스로 점검해요"
          />

          {/* Context header */}
          <Card className="mb-6 p-4">
            <h2 className="text-base font-medium text-text-primary mb-2">
              {session.problem.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
              <span className={cn('font-medium', getPlatformColor(session.problem.platform))}>
                {session.problem.platform}
              </span>
              <span className="text-text-muted">·</span>
              <span className={cn('font-medium', getDifficultyColor(session.problem.difficulty))}>
                {session.problem.difficulty}
              </span>
              {session.problem.tags.length > 0 && (
                <>
                  <span className="text-text-muted">·</span>
                  {session.problem.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-background-tertiary px-1.5 py-0.5 text-text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </>
              )}
            </div>
            {session.judge ? (
              <p className="text-xs text-text-muted">
                Last judge estimate:{' '}
                <span className="text-text-secondary">
                  {getVerdictLabel(session.judge.verdict)}
                  {session.judge.confidence != null && (
                    <> ({Math.round(session.judge.confidence * 100)}%)</>
                  )}
                </span>
              </p>
            ) : (
              <p className="text-xs text-text-muted">
                No submission yet — answer based on your current understanding.
              </p>
            )}
          </Card>

          <form onSubmit={handleSubmit} className="space-y-5">
            {QUESTIONS.map((q, idx) => (
              <Card key={q.id}>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-text-primary">
                    Q{idx + 1}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {q.text}
                  </p>
                  <Textarea
                    value={answers[q.id]}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="본인의 말로 설명해보세요"
                    rows={4}
                    required
                  />
                </div>
              </Card>
            ))}

            {/* Understanding level */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-text-primary">
                  이해도 선택
                </h3>
                <div className="space-y-2">
                  {LEVELS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-[10px] border cursor-pointer transition-colors',
                        level === opt.value
                          ? 'border-accent/50 bg-accent-muted/30'
                          : 'border-border bg-background-secondary hover:border-[rgba(255,255,255,0.12)]'
                      )}
                    >
                      <input
                        type="radio"
                        name="level"
                        value={opt.value}
                        checked={level === opt.value}
                        onChange={() => setLevel(opt.value)}
                        className="sr-only peer"
                      />
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex-shrink-0',
                          level === opt.value
                            ? 'border-accent bg-accent'
                            : 'border-text-muted'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text-primary">
                          {opt.label}
                        </span>
                        <span className="text-xs text-text-muted ml-2">
                          {opt.schedule}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                {level === 'FULL' && (
                  <div className="pt-2 flex items-center gap-2">
                    <Toggle
                      checked={fullPlus14}
                      onChange={(e) => setFullPlus14(e.target.checked)}
                      label="Schedule 14 days instead of 7"
                    />
                  </div>
                )}
              </div>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 z-10 md:relative md:bottom-auto md:left-auto md:right-auto border-t border-border bg-background/95 backdrop-blur-sm md:border-0 md:bg-transparent p-4 md:p-0 md:pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full md:w-auto"
                disabled={!canSubmit}
              >
                제출하기
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
