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

  const dueReviews = useMemo(() => getDueReviews(), [getDueReviews])
  const unfinishedSessions = useMemo(() => getUnfinishedSessions(), [getUnfinishedSessions])

  // Determine primary action
  const primaryAction = useMemo(() => {
    if (dueReviews.length > 0) {
      return {
        type: 'review' as const,
        title: '지금 복습할 시간이에요',
        cta: '지금 복습하기',
        href: '/review',
        session: dueReviews[0],
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
      title: '오늘은 세션 하나만 열자',
      cta: '세션 시작하기',
      href: '/start',
      session: null,
    }
  }, [dueReviews, unfinishedSessions])

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
          {/* Today Focus - PRIMARY ACTION */}
          <div className="mb-10 md:mb-12">
            <Card className="space-y-5">
              <div>
                <h1 
                  className="text-2xl sm:text-3xl md:text-4xl font-semibold text-text-primary mb-2"
                  style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
                >
                  {primaryAction.title}
                </h1>
                {primaryAction.session && (
                  <div className="mt-4 pb-4">
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
                {/* CTA 영역 - 버튼 2개 */}
                <div className="pt-6 flex flex-col sm:flex-row gap-3">
                  <Link href={primaryAction.href} className="flex-1 sm:flex-initial">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto">
                      {primaryAction.cta}
                    </Button>
                  </Link>
                  {primaryAction.type !== 'start' && (
                    <Link href="/start" className="flex-1 sm:flex-initial">
                      <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                        새 세션 시작
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
