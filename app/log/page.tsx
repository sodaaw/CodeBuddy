'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Slider } from '@/components/ui/Slider'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

const DIFFICULTY_LABELS = ['매우 쉬움', '쉬움', '보통', '어려움', '매우 어려움']
const PROBLEM_TYPES = [
  'DFS/BFS',
  '구현',
  'DP',
  '그리디',
  '문자열',
  '자료구조',
  '그래프',
  '수학',
  '정렬',
  '이진 탐색',
  '트리',
  '기타',
]

export default function LogPage() {
  const router = useRouter()
  const [showToast, setShowToast] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [problemLink, setProblemLink] = useState('')
  const [problemType, setProblemType] = useState('')
  const [difficulty, setDifficulty] = useState(3)
  const [isSuccess, setIsSuccess] = useState('success')
  const [timeSpent, setTimeSpent] = useState('')
  const [usedHint, setUsedHint] = useState(false)
  const [memo, setMemo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Fake submission delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    setShowToast(true)
    setIsSubmitting(false)

    // Redirect after toast
    setTimeout(() => {
      const fakeSessionId = `session-${Date.now()}`
      router.push(`/check/${fakeSessionId}`)
    }, 1500)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
          <PageHeader
            title="문제 기록하기"
            description="풀이한 문제를 기록하고 관리하세요"
          />

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* 문제 정보 섹션 */}
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-5">
                문제 정보
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    문제 링크 또는 문제 번호 입력
                  </label>
                  <Input
                    type="text"
                    value={problemLink}
                    onChange={(e) => setProblemLink(e.target.value)}
                    placeholder="https://www.acmicpc.net/problem/2178 또는 LeetCode 200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    문제 유형 선택
                  </label>
                  <Select
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value)}
                    required
                  >
                    <option value="">선택하세요</option>
                    {PROBLEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    체감 난이도
                  </label>
                  <div className="space-y-3">
                    <Slider
                      type="range"
                      min="1"
                      max="5"
                      value={difficulty}
                      onChange={(e) => setDifficulty(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">
                        {DIFFICULTY_LABELS[difficulty - 1]}
                      </span>
                      <span className="text-sm text-text-muted">
                        {difficulty} / 5
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 풀이 결과 섹션 */}
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-5">
                풀이 결과
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    풀이 성공 여부
                  </label>
                  <SegmentedToggle
                    options={[
                      { value: 'success', label: '성공' },
                      { value: 'failure', label: '실패' },
                    ]}
                    value={isSuccess}
                    onChange={setIsSuccess}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    풀이 소요 시간 (분)
                  </label>
                  <Input
                    type="number"
                    value={timeSpent}
                    onChange={(e) => setTimeSpent(e.target.value)}
                    placeholder="예: 30"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={usedHint}
                      onChange={(e) => setUsedHint(e.target.checked)}
                      className="w-4 h-4 rounded border border-border bg-background-secondary text-accent focus:ring-1 focus:ring-accent/10 focus:ring-offset-0 cursor-pointer transition-all duration-150 ease-out checked:bg-accent checked:border-accent"
                    />
                    <span className="text-sm text-text-primary">
                      풀이 중 힌트를 사용했어요
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 메모 섹션 */}
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-5">
                메모
              </h2>
              <div>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="헷갈렸던 포인트나 다음에 볼 때 기억할 점"
                  rows={4}
                />
              </div>
            </div>

            {/* Submit Button - Sticky on mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-10 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto border-t border-border bg-background/95 backdrop-blur-sm md:border-0 md:bg-transparent md:backdrop-blur-none p-4 md:p-0 md:pt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full md:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : '문제 기록 저장하기'}
              </Button>
            </div>
          </form>
        </div>

        {showToast && (
          <Toast
            message="문제가 기록되었어요"
            type="success"
            duration={2000}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
