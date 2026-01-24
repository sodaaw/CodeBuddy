'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { getToday, getReviews } from '@/lib/api'
import type { Recommendation, ReviewItem } from '@/lib/mock/data'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function formatDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return 'text-green-400'
    case 'medium':
      return 'text-yellow-400'
    case 'hard':
      return 'text-red-400'
  }
}

function getPlatformColor(platform: 'BOJ' | 'LeetCode' | 'Programmers'): string {
  switch (platform) {
    case 'BOJ':
      return 'text-blue-400'
    case 'LeetCode':
      return 'text-orange-400'
    case 'Programmers':
      return 'text-purple-400'
  }
}

export default function HomePage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [recs, revs] = await Promise.all([getToday(), getReviews()])
      setRecommendations(recs)
      setReviews(revs)
      setLoading(false)
    }
    loadData()
  }, [])

  const today = new Date()
  const dateLabel = formatDate(today)

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
          <PageHeader
            title="Today"
            description="Your coding practice for today"
            action={
              <span className="text-sm text-text-muted">{dateLabel}</span>
            }
          />

          <div className="space-y-6">
            {/* Section 1: Review Due */}
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide">
                Review due
              </h2>
              <Card>
                {loading ? (
                  <p className="text-text-muted text-sm">Loading...</p>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 2).map((review) => (
                      <div
                        key={review.id}
                        className="pb-4 last:pb-0 border-b border-[rgba(255,255,255,0.06)] last:border-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base font-medium text-text-primary">
                                {review.problemTitle}
                              </h3>
                              <Badge variant="muted" className="text-xs">
                                Due today
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn('text-xs font-medium', getPlatformColor(review.platform))}>
                                {review.platform}
                              </span>
                              <span className="text-text-muted text-xs">•</span>
                              <span className={cn('text-xs font-medium', getDifficultyColor(review.difficulty))}>
                                {review.difficulty}
                              </span>
                              {review.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="muted" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Link href="/review">
                        <Button variant="primary" className="w-full sm:w-auto">
                          Start review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-muted text-sm py-2">No reviews due today</p>
                )}
              </Card>
            </div>

            {/* Section 2: Recommended Problems */}
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide">
                Recommended problems
              </h2>
              {loading ? (
                <Card>
                  <p className="text-text-muted text-sm">Loading...</p>
                </Card>
              ) : recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec) => (
                    <Card 
                      key={rec.id} 
                      className="hover:border-[rgba(255,255,255,0.1)] transition-colors duration-150 cursor-default"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-text-primary mb-2">
                            {rec.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={cn('text-xs font-medium', getPlatformColor(rec.platform))}>
                              {rec.platform}
                            </span>
                            <span className="text-text-muted text-xs">•</span>
                            <span className={cn('text-xs font-medium', getDifficultyColor(rec.difficulty))}>
                              {rec.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-text-muted leading-relaxed">{rec.reason}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <p className="text-text-muted text-sm py-2">No recommendations yet</p>
                </Card>
              )}
            </div>

            {/* Section 3: Primary Action */}
            <div className="pt-2">
              <Link href="/log">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Log a new problem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
