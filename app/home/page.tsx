'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useSessionStore } from '@/lib/store/sessionStore'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'BOJ':
      return 'text-blue-400'
    case 'LeetCode':
      return 'text-orange-400'
    case 'Programmers':
      return 'text-purple-400'
    default:
      return 'text-text-muted'
  }
}

function getDifficultyColor(difficulty: string): string {
  const lower = difficulty.toLowerCase()
  if (lower === 'easy') return 'text-green-400'
  if (lower === 'medium') return 'text-yellow-400'
  if (lower === 'hard') return 'text-red-400'
  return 'text-text-muted'
}

export default function HomePage() {
  const { getDueReviews, getUnfinishedSessions } = useSessionStore()
  const hasAnySessions = useSessionStore((state) => Object.keys(state.sessions).length > 0)

  const dueReviews = useMemo(() => getDueReviews(), [getDueReviews])
  const unfinishedSessions = useMemo(() => getUnfinishedSessions(), [getUnfinishedSessions])

  // Determine primary action
  const primaryAction = useMemo(() => {
    if (dueReviews.length > 0) {
      const session = dueReviews[0]
      return {
        type: 'review' as const,
        title: '지금 복습할 시간이에요',
        cta: '지금 복습하기',
        // 복습 버튼 클릭 시 회상/이해도 작성 화면이 아닌
        // 바로 문제 풀이 화면으로 이동하도록 solve 세션으로 연결
        href: `/solve/${session.id}`,
        session,
      }
    }
    if (unfinishedSessions.length > 0) {
      const session = unfinishedSessions[0]
      const isSubmitted = session.status === 'SUBMITTED'
      return {
        type: 'continue' as const,
        title: '이어서 마무리해요',
        cta: '이어서 하기',
        href: isSubmitted ? `/check/${session.id}` : `/solve/${session.id}`,
        session,
      }
    }
    return {
      type: 'start' as const,
      title: '오늘의 첫 기록을 남겨볼까요?',
      cta: '세션 시작하기',
      href: '/start',
      session: null,
    }
  }, [dueReviews, unfinishedSessions])

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
          {/* Hero (start) or Today Focus Card (review/continue) */}
          {primaryAction.type === 'start' ? (
            <section
              className="pt-12 pb-20 md:pt-20 md:pb-28"
              aria-label="오늘의 첫 기록"
            >
              <div className="text-center flex flex-col items-center gap-6">
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl font-semibold text-text-primary max-w-xl"
                  style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
                >
                  {primaryAction.title}
                </h1>
                <Link href={primaryAction.href}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="h-14 px-8 text-base sm:text-lg rounded-[12px] min-w-[200px] font-semibold shadow-[0_0_0_1px_rgba(53,192,130,0.2),0_4px_20px_rgba(53,192,130,0.15)] hover:shadow-[0_0_0_1px_rgba(62,207,142,0.25),0_6px_24px_rgba(62,207,142,0.18)]"
                  >
                    {primaryAction.cta}
                  </Button>
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section
                className="pt-12 pb-8 md:pt-16 md:pb-10"
                aria-label={primaryAction.title}
              >
                <div className="text-center">
                  <h1
                    className="text-2xl sm:text-3xl md:text-4xl font-semibold text-text-primary max-w-xl mx-auto"
                    style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
                  >
                    {primaryAction.title}
                  </h1>
                </div>
              </section>
              <div className="mb-6 md:mb-8">
                <Card className="space-y-4">
                  <div>
                    {primaryAction.session && (
                      <div className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base font-medium text-text-primary">
                                {primaryAction.session.problem.title}
                              </h3>
                              {primaryAction.type === 'review' && (
                                <Badge variant="muted" className="text-xs">
                                  복습 예정
                                </Badge>
                              )}
                              {primaryAction.type === 'continue' && (
                                <Badge variant="muted" className="text-xs">
                                  진행 중
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn('text-xs font-medium', getPlatformColor(primaryAction.session.problem.platform))}>
                                {primaryAction.session.problem.platform}
                              </span>
                              <span className="text-text-muted text-xs">•</span>
                              <span className={cn('text-xs font-medium', getDifficultyColor(primaryAction.session.problem.difficulty))}>
                                {primaryAction.session.problem.difficulty}
                              </span>
                              {primaryAction.session.problem.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="muted" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <Link href={primaryAction.href} className="flex-1 sm:flex-initial">
                        <Button variant="primary" size="md" className="w-full sm:w-auto">
                          {primaryAction.cta}
                        </Button>
                      </Link>
                      <Link href="/start" className="flex-1 sm:flex-initial">
                        <Button variant="secondary" size="md" className="w-full sm:w-auto">
                          새 세션 시작
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 3-step 가이드 */}
              <div className="mb-10 md:mb-12">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-accent">1</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-1">
                        기록
                      </h3>
                      <p className="text-sm text-text-muted">
                        문제를 풀고 풀이를 메모와 함께 기록하세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-accent">2</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-1">
                        체크 질문
                      </h3>
                      <p className="text-sm text-text-muted">
                        AI가 만든 질문으로 이해도를 확인하고 검증하세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-accent">3</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-1">
                        복습
                      </h3>
                      <p className="text-sm text-text-muted">
                        최적의 타이밍에 복습해 오래 기억하도록 돕습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty State: Process explanation (no sessions) or Feature cards (has sessions) */}
          {primaryAction.type === 'start' ? (
            <div className="pt-10 md:pt-16 border-t border-[rgba(255,255,255,0.06)]">
              {!hasAnySessions ? (
                /* Empty state: 3-step process explanation */
                <div className="max-w-2xl mx-auto">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[rgba(53,192,130,0.12)] flex items-center justify-center">
                        <span className="text-sm font-medium text-[#35c082]">1</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h3 className="text-base font-medium text-text-primary mb-1">
                          기록
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                          문제를 풀고, 풀이를 짧게 남겨요.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[rgba(53,192,130,0.12)] flex items-center justify-center">
                        <span className="text-sm font-medium text-[#35c082]">2</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h3 className="text-base font-medium text-text-primary mb-1">
                          이해 확인
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                          AI 질문으로 진짜 이해했는지 확인해요.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[rgba(53,192,130,0.12)] flex items-center justify-center">
                        <span className="text-sm font-medium text-[#35c082]">3</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h3 className="text-base font-medium text-text-primary mb-1">
                          복습
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                          잊을 때쯤 다시 꺼내드려요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Has sessions: Feature cards */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 md:mb-12">
                    <Card>
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-text-primary">
                          빠른 기록
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                          문제를 풀고 풀이를 기록하면 복습 일정이 자동으로 잡혀요.
                        </p>
                        <Link href="/start">
                          <Button variant="secondary" size="md" className="w-full sm:w-auto">
                            바로 기록
                          </Button>
                        </Link>
                      </div>
                    </Card>

                    <Card>
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-text-primary">
                          복습
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                          {dueReviews.length > 0 
                            ? `복습할 문제 ${dueReviews.length}개가 있어요.`
                            : '복습할 문제가 없어요.'}
                        </p>
                        <Link href="/review">
                          <Button variant="secondary" size="md" className="w-full sm:w-auto">
                            복습 흐름 보기
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>

                  {/* 3-step 가이드 */}
                  <div className="mb-10 md:mb-12">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-muted flex items-center justify-center">
                          <span className="text-xs font-medium text-accent">1</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-text-primary mb-1">
                            기록
                          </h3>
                          <p className="text-sm text-text-muted">
                            문제를 풀고 풀이를 메모와 함께 기록하세요.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-muted flex items-center justify-center">
                          <span className="text-xs font-medium text-accent">2</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-text-primary mb-1">
                            체크 질문
                          </h3>
                          <p className="text-sm text-text-muted">
                            AI가 만든 질문으로 이해도를 확인하고 검증하세요.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-muted flex items-center justify-center">
                          <span className="text-xs font-medium text-accent">3</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-text-primary mb-1">
                            복습
                          </h3>
                          <p className="text-sm text-text-muted">
                            최적의 타이밍에 복습해 오래 기억하도록 돕습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  )
}
