'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { normalizeN8nResponse, type NormalizedN8nResponse } from '@/lib/utils/n8nResponse'

const WEBHOOK_URL = 'https://primary-production-b57a.up.railway.app/webhook/submit'

const BOJ_TIERS = [
  { value: '', label: '선택 안 함' },
  { value: 'b5', label: '브론즈 V' },
  { value: 'b4', label: '브론즈 IV' },
  { value: 'b3', label: '브론즈 III' },
  { value: 'b2', label: '브론즈 II' },
  { value: 'b1', label: '브론즈 I' },
  { value: 's5', label: '실버 V' },
  { value: 's4', label: '실버 IV' },
  { value: 's3', label: '실버 III' },
  { value: 's2', label: '실버 II' },
  { value: 's1', label: '실버 I' },
  { value: 'g5', label: '골드 V' },
  { value: 'g4', label: '골드 IV' },
  { value: 'g3', label: '골드 III' },
  { value: 'g2', label: '골드 II' },
  { value: 'g1', label: '골드 I' },
  { value: 'p5', label: '플래티넘 V' },
  { value: 'p4', label: '플래티넘 IV' },
  { value: 'p3', label: '플래티넘 III' },
  { value: 'p2', label: '플래티넘 II' },
  { value: 'p1', label: '플래티넘 I' },
  { value: 'd5', label: '다이아 V' },
  { value: 'd4', label: '다이아 IV' },
  { value: 'd3', label: '다이아 III' },
  { value: 'd2', label: '다이아 II' },
  { value: 'd1', label: '다이아 I' },
  { value: 'r5', label: '루비 V' },
  { value: 'r4', label: '루비 IV' },
  { value: 'r3', label: '루비 III' },
  { value: 'r2', label: '루비 II' },
  { value: 'r1', label: '루비 I' },
] as const

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  // 회원가입 전용
  const [nickname, setNickname] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [bojId, setBojId] = useState('')
  const [bojTier, setBojTier] = useState('')
  const [leetcodeId, setLeetcodeId] = useState('')
  const [programmersId, setProgrammersId] = useState('')

  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  // n8n 웹훅 제출 폼 상태
  const [userId, setUserId] = useState('test-user')
  const [problemId, setProblemId] = useState('1000')
  const [code, setCode] = useState("print('hello')")
  const [timeSpentMin, setTimeSpentMin] = useState('10')
  const [hintUsed, setHintUsed] = useState(false)
  const [selfReportDifficulty, setSelfReportDifficulty] = useState('3')
  
  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<any>(null)
  const [normalizedResponse, setNormalizedResponse] = useState<NormalizedN8nResponse | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [corsError, setCorsError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp && password !== passwordConfirm) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    // 보여주기용 fake auth – 추가 필드는 저장하지 않음
    login(email, password)
    router.push('/home')
  }

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp)
    setPasswordMismatch(false)
    if (!isSignUp) {
      setNickname('')
      setPasswordConfirm('')
      setBojId('')
      setBojTier('')
      setLeetcodeId('')
      setProgrammersId('')
    }
  }

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setCorsError(false)
    setRawResponse(null)
    setNormalizedResponse(null)

    // 폼 데이터 수집 및 검증
    const trimmedCode = code.trim()
    if (!trimmedCode) {
      setSubmitError('코드를 입력해주세요.')
      setIsSubmitting(false)
      return
    }

    const payload = {
      userId: userId.trim() || 'test-user',
      problemId: parseInt(problemId, 10) || 1000,
      language: 'python',
      code: trimmedCode,
      timeSpentMin: parseInt(timeSpentMin, 10) || 10,
      hintUsed: hintUsed,
      selfReportDifficulty: parseInt(selfReportDifficulty, 10) || 3,
    }

    try {
      // 먼저 직접 웹훅 호출 시도
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      setRawResponse(data)
      const normalized = normalizeN8nResponse(data)
      setNormalizedResponse(normalized)
    } catch (error: any) {
      // CORS 에러 체크
      if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
        setCorsError(true)
        // API 라우트를 통해 재시도
        try {
          const proxyResponse = await fetch('/api/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })

          if (!proxyResponse.ok) {
            const errorText = await proxyResponse.text()
            throw new Error(`HTTP ${proxyResponse.status}: ${errorText}`)
          }

          const data = await proxyResponse.json()
          setRawResponse(data)
          const normalized = normalizeN8nResponse(data)
          setNormalizedResponse(normalized)
          setCorsError(false) // 성공 시 CORS 에러 플래그 해제
        } catch (proxyError: any) {
          setSubmitError(`프록시 요청 실패: ${proxyError.message}`)
          setRawResponse({ error: proxyError.message })
        }
      } else {
        setSubmitError(error.message || '요청 실패')
        setRawResponse({ error: error.message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className={cn('w-full', isSignUp ? 'max-w-lg' : 'max-w-md')}>
        <div className="mb-6 md:mb-8 text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-xl font-medium text-text-primary">CodeBuddy</span>
          </Link>
          <h1
            className="text-2xl font-medium text-text-primary mb-2"
            style={{ letterSpacing: '-0.02em', fontWeight: 500 }}
          >
            {isSignUp ? '계정 만들기' : '돌아오신 것을 환영합니다'}
          </h1>
          <p className="text-sm text-text-muted">
            {isSignUp
              ? '코딩 연습 여정을 시작하세요'
              : '(개발중) 이메일/비번 아무거나 입력하면 로그인 가능'}
          </p>
        </div>

        <Card className="p-5 md:p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                  이메일
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="예시@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  비밀번호
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    const next = e.target.value
                    setPasswordMismatch(!!passwordConfirm && next !== passwordConfirm)
                  }}
                  required
                />
              </div>

              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-text-secondary mb-2">
                      비밀번호 확인
                    </label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={passwordConfirm}
                      onChange={(e) => {
                        const next = e.target.value
                        setPasswordConfirm(next)
                        setPasswordMismatch(!!next && password !== next)
                      }}
                      required
                      className={cn(passwordMismatch && 'border-red-500/50 focus:border-red-500')}
                    />
                    {passwordMismatch && (
                      <p className="mt-1.5 text-xs text-red-400">비밀번호가 일치하지 않아요.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-text-secondary mb-2">
                      별명
                    </label>
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="다른 사람에게 보일 이름"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                    />
                  </div>

                  {/* 코딩 플랫폼 섹션 */}
                  <div className="mt-12 pt-8 pb-6 border-t border-[rgba(255,255,255,0.08)]">
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-text-primary mb-1.5">코딩 플랫폼 (선택)</h3>
                      <p className="text-xs text-text-muted">선택 입력이에요. 나중에 설정에서도 추가할 수 있어요.</p>
                    </div>
                    <div className="space-y-6">
                      {/* 백준 그룹 */}
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-3">백준</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="bojId" className="block text-xs text-text-secondary mb-2">
                              백준 아이디 (선택)
                            </label>
                            <Input
                              id="bojId"
                              type="text"
                              placeholder="acmicpc.net 아이디"
                              value={bojId}
                              onChange={(e) => setBojId(e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="bojTier" className="block text-xs text-text-secondary mb-2">
                              백준 티어 (선택)
                            </label>
                            <Select
                              id="bojTier"
                              value={bojTier}
                              onChange={(e) => setBojTier(e.target.value)}
                            >
                              {BOJ_TIERS.map(({ value, label }) => (
                                <option key={value || 'none'} value={value}>
                                  {label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* LeetCode */}
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-3">LeetCode</p>
                        <div>
                          <label htmlFor="leetcodeId" className="block text-xs text-text-secondary mb-2">
                            LeetCode 아이디 (선택)
                          </label>
                          <Input
                            id="leetcodeId"
                            type="text"
                            placeholder="leetcode.com/u/..."
                            value={leetcodeId}
                            onChange={(e) => setLeetcodeId(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Programmers */}
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-3">Programmers</p>
                        <div>
                          <label htmlFor="programmersId" className="block text-xs text-text-secondary mb-2">
                            Programmers 아이디 (선택)
                          </label>
                          <Input
                            id="programmersId"
                            type="text"
                            placeholder="programmers.co.kr"
                            value={programmersId}
                            onChange={(e) => setProgrammersId(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-10">
              <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isSignUp && passwordMismatch}>
                {isSignUp ? '회원가입' : '로그인'}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-150"
            >
              {isSignUp ? (
                <>
                  이미 계정이 있으신가요? <span className="text-accent">로그인</span>
                </>
              ) : (
                <>
                  계정이 없으신가요? <span className="text-accent">회원가입</span>
                </>
              )}
            </button>
          </div>
        </Card>

        {/* n8n 웹훅 제출 폼 */}
        <Card className="p-5 md:p-6 mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-text-primary mb-2">코드 제출 (n8n 웹훅 테스트)</h2>
            <p className="text-sm text-text-muted">코드를 제출하고 채점 결과를 확인하세요.</p>
          </div>

          <form onSubmit={handleWebhookSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-text-secondary mb-2">
                    사용자 ID
                  </label>
                  <Input
                    id="userId"
                    type="text"
                    placeholder="test-user"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="problemId" className="block text-sm font-medium text-text-secondary mb-2">
                    문제 ID
                  </label>
                  <Input
                    id="problemId"
                    type="number"
                    placeholder="1000"
                    value={problemId}
                    onChange={(e) => setProblemId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-text-secondary mb-2">
                  코드
                </label>
                <textarea
                  id="code"
                  rows={8}
                  className={cn(
                    'w-full rounded-[10px] border border-border bg-background-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
                    'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/10',
                    'transition-all duration-200 ease-out font-mono',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  placeholder="코드를 입력하세요..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="timeSpentMin" className="block text-sm font-medium text-text-secondary mb-2">
                    소요 시간 (분)
                  </label>
                  <Input
                    id="timeSpentMin"
                    type="number"
                    placeholder="10"
                    value={timeSpentMin}
                    onChange={(e) => setTimeSpentMin(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="selfReportDifficulty" className="block text-sm font-medium text-text-secondary mb-2">
                    난이도 (1-5)
                  </label>
                  <Input
                    id="selfReportDifficulty"
                    type="number"
                    min="1"
                    max="5"
                    placeholder="3"
                    value={selfReportDifficulty}
                    onChange={(e) => setSelfReportDifficulty(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hintUsed}
                      onChange={(e) => setHintUsed(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-background-secondary text-accent focus:ring-accent/20"
                    />
                    <span className="text-sm text-text-secondary">힌트 사용</span>
                  </label>
                </div>
              </div>
            </div>

            {corsError && (
              <div className="mt-4 p-3 rounded-[8px] bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400">
                  CORS 문제 발생: 서버 사이드 프록시를 통해 요청을 전송합니다.
                </p>
              </div>
            )}

            {submitError && (
              <div className="mt-4 p-3 rounded-[8px] bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 font-medium mb-2">에러 발생</p>
                <p className="text-xs text-red-300">{submitError}</p>
                {rawResponse && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-300 cursor-pointer">원본 응답 보기</summary>
                    <pre className="mt-2 text-xs text-red-200 overflow-auto p-2 bg-black/20 rounded">
                      {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="mt-6">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    채점 중...
                  </span>
                ) : (
                  '제출하기'
                )}
              </Button>
            </div>
          </form>

          {/* 응답 렌더링 */}
          {normalizedResponse && (
            <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.08)]">
              <h3 className="text-lg font-medium text-text-primary mb-4">채점 결과</h3>
              
              <div className="space-y-4">
                {/* Verdict */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-text-secondary">결과</span>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-[6px] text-sm font-semibold',
                        normalizedResponse.verdict === 'AC'
                          ? 'bg-green-500/20 text-green-400'
                          : normalizedResponse.verdict === 'WA'
                          ? 'bg-red-500/20 text-red-400'
                          : normalizedResponse.verdict === 'TLE'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      )}
                    >
                      {normalizedResponse.verdict}
                    </span>
                  </div>
                </div>

                {/* Passed/Total */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">통과한 테스트</span>
                    <span className="text-sm text-text-primary">
                      {normalizedResponse.passed} / {normalizedResponse.total}
                    </span>
                  </div>
                  {normalizedResponse.total > 0 && (
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${(normalizedResponse.passed / normalizedResponse.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Understanding Level */}
                {normalizedResponse.understandingLevel && (
                  <div>
                    <span className="text-sm font-medium text-text-secondary">이해도: </span>
                    <span className="text-sm text-text-primary">{normalizedResponse.understandingLevel}</span>
                  </div>
                )}

                {/* Needs Review */}
                {normalizedResponse.needsReview && (
                  <div>
                    <span className="inline-block px-3 py-1 rounded-[6px] text-sm font-medium bg-accent/20 text-accent">
                      복습 필요
                    </span>
                  </div>
                )}

                {/* Review Days */}
                {normalizedResponse.reviewDays.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-text-secondary mb-2 block">복습 일정</span>
                    <div className="flex flex-wrap gap-2">
                      {normalizedResponse.reviewDays.map((day, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-[6px] text-xs font-medium bg-background-tertiary text-text-secondary border border-border"
                        >
                          D+{day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hint Level 1 */}
                {normalizedResponse.hintLevel1 && (
                  <div className="p-4 rounded-[8px] bg-accent/10 border border-accent/20">
                    <p className="text-xs font-medium text-accent mb-2">힌트</p>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{normalizedResponse.hintLevel1}</p>
                  </div>
                )}

                {/* Followup Questions */}
                {normalizedResponse.followupQuestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-text-secondary mb-3">추가 질문</p>
                    <ol className="list-decimal list-inside space-y-2">
                      {normalizedResponse.followupQuestions.map((question, idx) => (
                        <li key={idx} className="text-sm text-text-primary pl-2">
                          {question}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Debug 섹션 */}
              <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-150 flex items-center gap-2"
                >
                  <span>{showDebug ? '▼' : '▶'}</span>
                  <span>디버그 정보</span>
                </button>
                {showDebug && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-text-muted mb-2">요청 페이로드</p>
                      <pre className="text-xs text-text-secondary bg-background-tertiary p-3 rounded-[6px] overflow-auto">
                        {JSON.stringify(
                          {
                            userId: userId.trim() || 'test-user',
                            problemId: parseInt(problemId, 10) || 1000,
                            language: 'python',
                            code: code.trim(),
                            timeSpentMin: parseInt(timeSpentMin, 10) || 10,
                            hintUsed: hintUsed,
                            selfReportDifficulty: parseInt(selfReportDifficulty, 10) || 3,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-muted mb-2">원본 응답</p>
                      <pre className="text-xs text-text-secondary bg-background-tertiary p-3 rounded-[6px] overflow-auto">
                        {JSON.stringify(rawResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
