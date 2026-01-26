'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

// 웹훅 URL (현재 비어있음, 나중에 설정)
const WEBHOOK_URL = ''

// 페이로드 타입 정의
type Payload = {
  userId: string
  problemId: string
  language: string
  code: string
  timeSpentMin: number
  hintUsed: boolean
  selfReportDifficulty: number
}

// 내부 로깅용 타입 (페이로드에 포함하지 않음)
type InternalMetadata = {
  createdAt: string
  attemptId: string
}

export default function LogAttemptPage() {
  // 폼 상태
  const [userId, setUserId] = useState('test-user')
  const [problemId, setProblemId] = useState('')
  const [code, setCode] = useState('')
  const [timeSpentMin, setTimeSpentMin] = useState('0')
  const [hintUsed, setHintUsed] = useState(false)
  const [selfReportDifficulty, setSelfReportDifficulty] = useState(3)

  // 에러 상태
  const [errors, setErrors] = useState<{
    userId?: string
    problemId?: string
    code?: string
    timeSpentMin?: string
    selfReportDifficulty?: string
  }>({})

  // 제출 상태
  const [payload, setPayload] = useState<Payload | null>(null)
  const [internalMetadata, setInternalMetadata] = useState<InternalMetadata | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    // userId 검사
    if (!userId.trim()) {
      newErrors.userId = '사용자 ID를 입력해주세요'
    }

    // problemId 검사
    if (!problemId.trim()) {
      newErrors.problemId = '문제 ID를 입력해주세요'
    }

    // code 검사 (trim 후 비어있으면 안됨)
    const trimmedCode = code.trim()
    if (!trimmedCode) {
      newErrors.code = '코드를 입력해주세요'
    }

    // timeSpentMin 검사
    const timeValue = parseInt(timeSpentMin, 10)
    if (isNaN(timeValue) || timeValue < 0) {
      newErrors.timeSpentMin = '0 이상의 정수를 입력해주세요'
    }

    // selfReportDifficulty는 1~5 범위이므로 슬라이더로 제한됨

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 페이로드 빌드
  const buildPayload = (): Payload => {
    const trimmedCode = code.trim()
    const timeValue = parseInt(timeSpentMin, 10) || 0

    return {
      userId: userId.trim(),
      problemId: problemId.trim(),
      language: 'python', // 고정값
      code: trimmedCode,
      timeSpentMin: Math.max(0, timeValue), // 음수 방지
      hintUsed: hintUsed,
      selfReportDifficulty: selfReportDifficulty,
    }
  }

  // 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const builtPayload = buildPayload()
    const metadata: InternalMetadata = {
      createdAt: new Date().toISOString(),
      attemptId: crypto.randomUUID(),
    }

    // 콘솔에 출력
    console.log('=== n8n Payload ===')
    console.log(JSON.stringify(builtPayload, null, 2))
    console.log('=== Internal Metadata (not in payload) ===')
    console.log(JSON.stringify(metadata, null, 2))

    setPayload(builtPayload)
    setInternalMetadata(metadata)
  }

  // 웹훅 전송 핸들러
  const handleSendWebhook = async () => {
    if (!WEBHOOK_URL || !payload) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log('Webhook sent successfully')
      alert('웹훅 전송 성공!')
    } catch (error) {
      console.error('Webhook error:', error)
      alert(`웹훅 전송 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2"
            style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
          >
            풀이 기록
          </h1>
          <p className="text-sm sm:text-base text-text-muted leading-relaxed">
            n8n 통합을 위한 풀이 데이터를 수집합니다
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="space-y-6">
            {/* userId */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-text-secondary mb-2">
                사용자 ID
              </label>
              <Input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value)
                  if (errors.userId) {
                    setErrors((prev) => ({ ...prev, userId: undefined }))
                  }
                }}
                placeholder="test-user"
              />
              {errors.userId && <p className="mt-1.5 text-xs text-red-400">{errors.userId}</p>}
            </div>

            {/* problemId */}
            <div>
              <label htmlFor="problemId" className="block text-sm font-medium text-text-secondary mb-2">
                문제 ID
              </label>
              <Input
                id="problemId"
                type="text"
                value={problemId}
                onChange={(e) => {
                  setProblemId(e.target.value)
                  if (errors.problemId) {
                    setErrors((prev) => ({ ...prev, problemId: undefined }))
                  }
                }}
                placeholder="A001"
              />
              {errors.problemId && <p className="mt-1.5 text-xs text-red-400">{errors.problemId}</p>}
            </div>

            {/* code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-text-secondary mb-2">
                코드
              </label>
              <Textarea
                id="code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  if (errors.code) {
                    setErrors((prev) => ({ ...prev, code: undefined }))
                  }
                }}
                placeholder="print('hello')"
                className="font-mono text-sm"
                rows={8}
              />
              {errors.code && <p className="mt-1.5 text-xs text-red-400">{errors.code}</p>}
            </div>

            {/* timeSpentMin */}
            <div>
              <label htmlFor="timeSpentMin" className="block text-sm font-medium text-text-secondary mb-2">
                소요 시간 (분)
              </label>
              <Input
                id="timeSpentMin"
                type="number"
                min="0"
                value={timeSpentMin}
                onChange={(e) => {
                  setTimeSpentMin(e.target.value)
                  if (errors.timeSpentMin) {
                    setErrors((prev) => ({ ...prev, timeSpentMin: undefined }))
                  }
                }}
                placeholder="0"
              />
              {errors.timeSpentMin && <p className="mt-1.5 text-xs text-red-400">{errors.timeSpentMin}</p>}
            </div>

            {/* hintUsed */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">힌트 사용 여부</label>
              <Toggle
                checked={hintUsed}
                onChange={(e) => setHintUsed(e.target.checked)}
                label="힌트를 사용했나요?"
              />
            </div>

            {/* selfReportDifficulty */}
            <div>
              <label htmlFor="selfReportDifficulty" className="block text-sm font-medium text-text-secondary mb-2">
                체감 난이도: {selfReportDifficulty} / 5
              </label>
              <div className="space-y-2">
                <Slider
                  id="selfReportDifficulty"
                  min={1}
                  max={5}
                  step={1}
                  value={selfReportDifficulty}
                  onChange={(e) => setSelfReportDifficulty(parseInt(e.target.value, 10))}
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>1 (매우 쉬움)</span>
                  <span>5 (매우 어려움)</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" size="lg">
                페이로드 생성
              </Button>
            </div>
          </Card>
        </form>

        {/* Payload Preview */}
        {payload && (
          <Card className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-text-primary mb-1">페이로드 미리보기</h2>
              <p className="text-xs text-text-muted">n8n으로 전송될 JSON 데이터입니다</p>
            </div>
            <pre className="bg-background-tertiary rounded-[8px] p-4 text-xs font-mono text-text-secondary overflow-x-auto">
              {JSON.stringify(payload, null, 2)}
            </pre>

            {/* Internal Metadata (참고용) */}
            {internalMetadata && (
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <p className="text-xs text-text-muted mb-2">내부 메타데이터 (페이로드에 포함되지 않음)</p>
                <pre className="bg-background-tertiary rounded-[8px] p-3 text-xs font-mono text-text-muted overflow-x-auto">
                  {JSON.stringify(internalMetadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Webhook Send Button */}
            <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              {!WEBHOOK_URL ? (
                <div className="text-center py-3">
                  <p className="text-sm text-text-muted mb-2">웹훅 URL이 설정되지 않았습니다</p>
                  <p className="text-xs text-text-muted">
                    WEBHOOK_URL 상수를 설정하면 n8n으로 전송할 수 있습니다
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  onClick={handleSendWebhook}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '전송 중...' : 'n8n으로 전송'}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
