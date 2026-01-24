'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { Drawer } from '@/components/ui/Drawer'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { getReviews, submitReviewResult, getHints } from '@/lib/api'
import type { ReviewItem } from '@/lib/mock/data'
import { cn } from '@/lib/utils'

const CONFIDENCE_LABELS = ['전혀 없음', '낮음', '보통', '높음', '매우 높음']

const REVIEW_MODES = [
  { value: 'concept', label: '한 줄 개념 설명' },
  { value: 'quick', label: 'O / X 빠른 확인' },
  { value: 'similar', label: '유사 문제 보기' },
]

function getDifficultyLabel(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return '쉬움'
    case 'medium':
      return '보통'
    case 'hard':
      return '어려움'
  }
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

function getReviewContext(review: ReviewItem): string {
  // Generate context text about why it's due
  const daysSince = Math.floor(
    (Date.now() - new Date(review.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSince === 0) {
    return '오늘 기록한 문제예요'
  } else if (daysSince === 1) {
    return '어제 기록한 문제예요'
  } else {
    return `${daysSince}일 전에 기록한 문제예요`
  }
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showHintDrawer, setShowHintDrawer] = useState(false)
  const [hints, setHints] = useState<string[]>([])
  const [currentHintStep, setCurrentHintStep] = useState(0)

  // Review mode state
  const [reviewMode, setReviewMode] = useState('concept')
  const [result, setResult] = useState<'correct' | 'incorrect'>('correct')
  const [confidence, setConfidence] = useState(3)

  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true)
      const data = await getReviews()
      setReviews(data)
      setIsLoading(false)
    }
    loadReviews()
  }, [])

  const handleReviewSelect = (review: ReviewItem) => {
    setSelectedReview(review)
    setReviewMode('concept')
    setResult('correct')
    setConfidence(3)
    setCurrentHintStep(0)
  }

  const handleCloseDetail = () => {
    setSelectedReview(null)
  }

  const handleShowHint = async () => {
    if (!selectedReview) return
    if (hints.length === 0) {
      const hintData = await getHints(selectedReview.id)
      setHints(hintData)
    }
    setShowHintDrawer(true)
    setCurrentHintStep(0)
  }

  const handleNextHint = () => {
    if (currentHintStep < hints.length - 1) {
      setCurrentHintStep(currentHintStep + 1)
    }
  }

  const handleSave = async () => {
    if (!selectedReview) return
    setIsSubmitting(true)

    await submitReviewResult(selectedReview.id, {
      passed: result === 'correct',
    })

    setIsSubmitting(false)
    setShowToast(true)

    // Remove from queue and close detail
    setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id))
    setSelectedReview(null)

    setTimeout(() => setShowToast(false), 2000)
  }

  const renderModeContent = () => {
    switch (reviewMode) {
      case 'concept':
        return (
          <div className="space-y-4">
            <p className="text-sm text-text-primary leading-relaxed">
              이 문제의 핵심 개념을 한 문장으로 설명해보세요. 알고리즘의 주요 아이디어와 접근 방식을 간단히 요약하면 됩니다.
            </p>
            <div className="p-4 rounded-[10px] bg-background-tertiary">
              <p className="text-sm text-text-muted italic">
                예시: 해시 테이블을 사용하여 각 숫자와 인덱스를 저장하고, 목표값에서 현재 숫자를 뺀 값이 해시 테이블에 있는지 확인하는 방식으로 O(n) 시간에 해결합니다.
              </p>
            </div>
          </div>
        )
      case 'quick':
        return (
          <div className="space-y-4">
            <p className="text-sm text-text-primary leading-relaxed mb-4">
              이 문제의 풀이 방법을 기억하고 있나요?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setResult('correct')}
                className={cn(
                  'flex-1 py-3 rounded-[10px] text-sm font-medium transition-all duration-150',
                  result === 'correct'
                    ? 'bg-accent text-white'
                    : 'bg-background-tertiary text-text-muted hover:text-text-primary'
                )}
              >
                O 맞음
              </button>
              <button
                type="button"
                onClick={() => setResult('incorrect')}
                className={cn(
                  'flex-1 py-3 rounded-[10px] text-sm font-medium transition-all duration-150',
                  result === 'incorrect'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-background-tertiary text-text-muted hover:text-text-primary'
                )}
              >
                X 틀림
              </button>
            </div>
          </div>
        )
      case 'similar':
        return (
          <div className="space-y-4">
            <p className="text-sm text-text-primary leading-relaxed">
              이 문제와 유사한 문제들을 살펴보세요. 같은 알고리즘 패턴을 사용하지만 변형된 형태의 문제들입니다.
            </p>
            <div className="space-y-3">
              <Card>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-primary">
                    Three Sum
                  </h4>
                  <p className="text-xs text-text-muted">
                    두 수의 합을 확장하여 세 수의 합을 찾는 문제
                  </p>
                </div>
              </Card>
              <Card>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-primary">
                    Four Sum
                  </h4>
                  <p className="text-xs text-text-muted">
                    해시 테이블과 투 포인터를 조합한 문제
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
              오늘 복습, 하나만 해볼까요?
            </h1>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              지금 복습하면 기억이 오래 남아요
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">로딩 중...</p>
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-text-muted text-sm mb-4">
                  복습할 문제가 없어요
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Review Queue List */}
              <div className="space-y-3">
                {reviews.map((review) => (
                  <Card
                    key={review.id}
                    className={cn(
                      'cursor-pointer transition-all duration-150',
                      selectedReview?.id === review.id
                        ? 'border-accent/40 bg-background-tertiary'
                        : 'hover:border-[rgba(255,255,255,0.12)] hover:bg-background-tertiary/50'
                    )}
                    onClick={() => handleReviewSelect(review)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-medium text-text-primary">
                            {review.problemTitle}
                          </h3>
                          <Badge variant="accent" className="text-xs font-medium">
                            오늘 복습
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted mb-2">
                          {getReviewContext(review)}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="muted" className="text-xs">
                            {review.tags[0]}
                          </Badge>
                          <Badge variant="muted" className="text-xs">
                            {getDifficultyLabel(review.difficulty)}
                          </Badge>
                        </div>
                      </div>
                      <svg
                        className={cn(
                          'w-5 h-5 flex-shrink-0 transition-colors duration-150',
                          selectedReview?.id === review.id
                            ? 'text-accent'
                            : 'text-text-muted group-hover:text-text-primary'
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Detail View - Desktop */}
              <div className="hidden lg:block lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
                {selectedReview ? (
                  <div className="space-y-6">
                    <Card>
                      <div className="space-y-6">
                        {/* Problem Title & Summary */}
                        <div className="space-y-3">
                          <h2 className="text-xl font-semibold text-text-primary">
                            {selectedReview.problemTitle}
                          </h2>
                          {selectedReview.summary && (
                            <p className="text-sm text-text-muted leading-relaxed">
                              {selectedReview.summary}
                            </p>
                          )}
                        </div>

                        {/* Review Mode Selector */}
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-3">
                            복습 모드
                          </label>
                          <SegmentedToggle
                            options={REVIEW_MODES}
                            value={reviewMode}
                            onChange={setReviewMode}
                            className="w-full"
                          />
                        </div>

                        {/* Mode Content */}
                        <div className="pt-2">{renderModeContent()}</div>

                        {/* Hint Button */}
                        <div>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={handleShowHint}
                            className="w-full"
                          >
                            힌트 보기
                          </Button>
                        </div>

                        {/* Result Controls */}
                        <div className="space-y-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-3">
                              풀이 결과
                            </label>
                            <SegmentedToggle
                              options={[
                                { value: 'correct', label: '맞음' },
                                { value: 'incorrect', label: '틀림' },
                              ]}
                              value={result}
                              onChange={(val) =>
                                setResult(val as 'correct' | 'incorrect')
                              }
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              자신감
                            </label>
                            <div className="space-y-3">
                              <Slider
                                type="range"
                                min="1"
                                max="5"
                                value={confidence}
                                onChange={(e) =>
                                  setConfidence(Number(e.target.value))
                                }
                                className="w-full"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-muted">
                                  {CONFIDENCE_LABELS[confidence - 1]}
                                </span>
                                <span className="text-sm text-text-muted">
                                  {confidence} / 5
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            size="lg"
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            {isSubmitting
                              ? '저장 중...'
                              : '복습 결과 저장하기'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <div className="text-center py-12 space-y-4">
                      <p className="text-sm text-text-primary leading-relaxed">
                        왼쪽에서 복습할 문제를 선택하면<br />
                        여기서 복습을 시작할 수 있어요
                      </p>
                      {reviews.length > 0 && (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleReviewSelect(reviews[0])}
                          className="mt-2"
                        >
                          첫 복습 시작하기
                        </Button>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Detail Drawer - Mobile */}
          {selectedReview && (
            <Drawer
              isOpen={true}
              onClose={handleCloseDetail}
              title={selectedReview.problemTitle}
              side="bottom"
              className="lg:hidden"
            >
              <div className="space-y-6 max-h-[calc(80vh-4rem)] overflow-y-auto">
                {/* Problem Summary */}
                {selectedReview.summary && (
                  <div>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {selectedReview.summary}
                    </p>
                  </div>
                )}

                {/* Review Mode Selector */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    복습 모드
                  </label>
                  <SegmentedToggle
                    options={REVIEW_MODES}
                    value={reviewMode}
                    onChange={setReviewMode}
                    className="w-full"
                  />
                </div>

                {/* Mode Content */}
                <div className="pt-2">{renderModeContent()}</div>

                {/* Hint Button */}
                <div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleShowHint}
                    className="w-full"
                  >
                    힌트 보기
                  </Button>
                </div>

                {/* Result Controls */}
                <div className="space-y-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      풀이 결과
                    </label>
                    <SegmentedToggle
                      options={[
                        { value: 'correct', label: '맞음' },
                        { value: 'incorrect', label: '틀림' },
                      ]}
                      value={result}
                      onChange={(val) =>
                        setResult(val as 'correct' | 'incorrect')
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      자신감
                    </label>
                    <div className="space-y-3">
                      <Slider
                        type="range"
                        min="1"
                        max="5"
                        value={confidence}
                        onChange={(e) =>
                          setConfidence(Number(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">
                          {CONFIDENCE_LABELS[confidence - 1]}
                        </span>
                        <span className="text-sm text-text-muted">
                          {confidence} / 5
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting
                      ? '저장 중...'
                      : '복습 결과 저장하기'}
                  </Button>
                </div>
              </div>
            </Drawer>
          )}

          {/* Hint Drawer */}
          <Drawer
            isOpen={showHintDrawer}
            onClose={() => setShowHintDrawer(false)}
            title="힌트"
            side="bottom"
          >
            <div className="space-y-4">
              {hints.length > 0 && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">
                        힌트 {currentHintStep + 1} / {hints.length}
                      </span>
                    </div>
                    <div className="p-4 rounded-[10px] bg-background-tertiary">
                      <p className="text-sm text-text-primary leading-relaxed">
                        {hints[currentHintStep]}
                      </p>
                    </div>
                  </div>

                  {currentHintStep < hints.length - 1 && (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleNextHint}
                      className="w-full"
                    >
                      다음 힌트 보기
                    </Button>
                  )}
                </>
              )}
            </div>
          </Drawer>

          {showToast && (
            <Toast
              message="복습 결과가 저장되었어요"
              type="success"
              duration={2000}
              onClose={() => setShowToast(false)}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
