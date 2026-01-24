'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { getCheckQuestions, submitCheckAnswers } from '@/lib/api'
import type { CheckQuestion, CheckResult } from '@/lib/mock/data'

interface CheckPageProps {
  params: {
    sessionId: string
  }
}

const RESULT_LABELS = {
  complete: '완전히 이해함',
  partial: '부분적으로 이해함',
  surface: '겉핥기 수준의 이해',
}

export default function CheckPage({ params }: CheckPageProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<CheckQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true)
      const data = await getCheckQuestions(params.sessionId)
      setQuestions(data)
      setIsLoading(false)
    }
    loadQuestions()
  }, [params.sessionId])

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const checkResult = await submitCheckAnswers(params.sessionId, answers)
    setResult(checkResult)
    setIsSubmitting(false)
  }

  const handleAddToReview = () => {
    setShowToast(true)
  }

  const handleGoHome = () => {
    router.push('/home')
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
            <PageHeader
              title="이해도 확인"
              description="방금 푼 문제를 얼마나 이해했는지 확인해요"
            />
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">질문을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (result) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
            <PageHeader
              title="이해도 확인"
              description="방금 푼 문제를 얼마나 이해했는지 확인해요"
            />

            {/* Result Panel */}
            <Card className="space-y-6">
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-medium text-text-secondary mb-5 uppercase tracking-wide">
                    평가 결과
                  </h2>
                  
                  <div className="space-y-5">
                    <div>
                      <p className="text-lg font-medium text-text-primary">
                        {RESULT_LABELS[result.level]}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-text-primary leading-relaxed">
                        {result.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-[rgba(255,255,255,0.06)]">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGoHome}
                  className="flex-1 sm:flex-none"
                >
                  홈으로 돌아가기
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleAddToReview}
                  className="flex-1 sm:flex-none"
                >
                  복습 목록에 추가하기
                </Button>
              </div>
            </Card>

            {showToast && (
              <Toast
                message="복습 목록에 추가되었어요"
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
          <PageHeader
            title="이해도 확인"
            description="방금 푼 문제를 얼마나 이해했는지 확인해요"
          />

          <form onSubmit={handleSubmit} className="space-y-5">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium text-text-primary mb-2">
                      질문 {index + 1}
                    </h3>
                    <p className="text-sm text-text-primary leading-relaxed">
                      {question.text}
                    </p>
                  </div>

                  <div>
                    <Textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="본인의 말로 설명해보세요"
                      rows={5}
                      required
                    />
                    <p className="text-xs text-text-muted mt-2">
                      본인의 말로 설명해보세요
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            {/* Submit Button - Sticky on mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-10 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto border-t border-border bg-background/95 backdrop-blur-sm md:border-0 md:bg-transparent md:backdrop-blur-none p-4 md:p-0 md:pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full md:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? '제출 중...' : '답변 제출하기'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
