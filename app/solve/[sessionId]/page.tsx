'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSessionStore } from '@/lib/store/sessionStore'
import { Session, JudgeResult } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/lib/utils'
import { createJudgeClient, validateJudgeResponse } from '@/lib/judge/client'
import { QuickLogModal } from '@/components/log/QuickLogModal'

// 웹훅 URL (현재 비어있음, 나중에 설정)
const WEBHOOK_URL = ''

// n8n 페이로드 타입
type N8nPayload = {
  userId: string
  problemId: string
  language: string
  code: string
  timeSpent: number
  hintUsed: boolean
  selfReportDifficulty: number
}

// Monaco Editor를 동적으로 로드 (SSR 방지)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface SolvePageProps {
  params: {
    sessionId: string
  }
}

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

function getVerdictColor(verdict: JudgeResult['verdict']): string {
  switch (verdict) {
    case 'PASS':
      return 'text-green-400'
    case 'LIKELY_PASS':
      return 'text-green-300'
    case 'FAIL':
      return 'text-red-400'
    case 'POSSIBLY_FAIL':
      return 'text-yellow-400'
    case 'TLE_RISK':
      return 'text-orange-400'
    default:
      return 'text-text-muted'
  }
}

function getVerdictLabel(verdict: JudgeResult['verdict']): string {
  switch (verdict) {
    case 'PASS':
      return '통과'
    case 'LIKELY_PASS':
      return '통과 가능'
    case 'FAIL':
      return '실패'
    case 'POSSIBLY_FAIL':
      return '실패 가능'
    case 'TLE_RISK':
      return '시간 초과 위험'
    default:
      return verdict
  }
}

function getVerdictStatusLabel(verdict: JudgeResult['verdict']): string {
  switch (verdict) {
    case 'PASS':
    case 'LIKELY_PASS':
      return '양호'
    case 'FAIL':
    case 'POSSIBLY_FAIL':
    case 'TLE_RISK':
      return '주의 필요'
    default:
      return '확인 필요'
  }
}

async function submitToJudge(session: Session): Promise<JudgeResult> {
  const client = createJudgeClient()

  const payload = {
    sessionId: session.id,
    problem: session.problem,
    language: session.language,
    code: session.code,
    userExplanation: '',
    runOutput: session.runOutput || '',
  }

  try {
    const rawResponse = await client.judge(payload)
    const validatedResponse = validateJudgeResponse(rawResponse)

    // JudgeResponse를 JudgeResult로 변환
    const judgeResult: JudgeResult = {
      verdict: validatedResponse.verdict,
      confidence: validatedResponse.confidence,
      reasons: validatedResponse.reasons,
      edge_cases_to_test: validatedResponse.edge_cases_to_test,
      time_complexity: validatedResponse.time_complexity,
      next_actions: validatedResponse.next_actions,
      createdAt: new Date().toISOString(),
    }

    return judgeResult
  } catch (error) {
    console.error('Judge 요청 중 오류:', error)
    throw error instanceof Error ? error : new Error('Judge 요청 중 알 수 없는 오류가 발생했습니다.')
  }
}

export default function SolvePage({ params }: SolvePageProps) {
  const router = useRouter()
  const { getSession, setCode, updateSession, setJudgeResult, setLog } = useSessionStore()
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [session, setSession] = useState<Session | undefined>(undefined)
  const [code, setCodeLocal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showProblemPanel, setShowProblemPanel] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const judgeResultRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const dummyDataUpdatedRef = useRef(false)

  // 시간 측정 관련 상태
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [pausedSeconds, setPausedSeconds] = useState(0) // 일시정지된 시간 누적
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // 힌트 관련 상태
  const [hintUsed, setHintUsed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showHintConfirm, setShowHintConfirm] = useState(false)

  // 체감 난이도 상태
  const [selfReportDifficulty, setSelfReportDifficulty] = useState(3)

  // 시간 측정 타이머
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current) / 1000) + pausedSeconds
        setElapsedSeconds(elapsed)
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [isTimerRunning, pausedSeconds])

  // 타이머 일시정지/재개
  const handleTimerToggle = () => {
    if (isTimerRunning) {
      // 일시정지
      setPausedSeconds(elapsedSeconds)
      setIsTimerRunning(false)
    } else {
      // 재개
      startTimeRef.current = Date.now()
      setIsTimerRunning(true)
    }
  }

  // 힌트 보기 핸들러
  const handleShowHint = () => {
    if (!hintUsed && !showHint) {
      // 첫 번째 클릭: 확인 메시지 표시
      setShowHintConfirm(true)
    } else {
      // 이미 힌트를 본 경우 또는 확인 후: 힌트 표시
      setShowHint(true)
      setShowHintConfirm(false)
    }
  }

  // 힌트 확인 핸들러
  const handleConfirmHint = () => {
    setHintUsed(true)
    setShowHint(true)
    setShowHintConfirm(false)
  }

  // 힌트 확인 취소 핸들러
  const handleCancelHint = () => {
    setShowHintConfirm(false)
  }

  // 세션 로드 및 코드 초기화
  useEffect(() => {
    const currentSessionId = params.sessionId

    // sessionId가 변경된 경우에만 초기화 플래그 리셋
    if (sessionIdRef.current !== currentSessionId) {
      initializedRef.current = false
      dummyDataUpdatedRef.current = false
      sessionIdRef.current = currentSessionId
      // 타이머 리셋
      setElapsedSeconds(0)
      setPausedSeconds(0)
      setIsTimerRunning(true)
      startTimeRef.current = Date.now()
      setHintUsed(false)
      setShowHint(false)
      setShowHintConfirm(false)
      setSelfReportDifficulty(3)
    }

    // 이미 초기화되었으면 스킵
    if (initializedRef.current) {
      return
    }

    const loadedSession = getSession(currentSessionId)
    if (!loadedSession) {
      return
    }

    initializedRef.current = true

    // 더미 데이터 추가: 문제 설명이 없으면 추가 (한 번만)
    if (!loadedSession.problem.statement && !dummyDataUpdatedRef.current) {
      const sessionWithDummy = {
        ...loadedSession,
        problem: {
          ...loadedSession.problem,
          statement: `## 문제 설명

정수 배열 \`nums\`와 정수 \`target\`이 주어졌을 때, 배열에서 두 숫자를 더해 \`target\`이 되는 인덱스를 반환하세요.

각 입력은 정확히 하나의 해를 가지며, 같은 원소를 두 번 사용할 수 없습니다.

답은 어떤 순서로든 반환할 수 있습니다.

## 예제

**예제 1:**
\`\`\`
입력: nums = [2,7,11,15], target = 9
출력: [0,1]
설명: nums[0] + nums[1] == 9 이므로 [0, 1]을 반환합니다.
\`\`\`

**예제 2:**
\`\`\`
입력: nums = [3,2,4], target = 6
출력: [1,2]
\`\`\`

**예제 3:**
\`\`\`
입력: nums = [3,3], target = 6
출력: [0,1]
\`\`\`

## 제약 조건

- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **정확히 하나의 해만 존재합니다.**

## 힌트

해시 테이블을 사용하면 O(n) 시간 복잡도로 해결할 수 있습니다.`,
          constraints: `- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- 정확히 하나의 해만 존재합니다.`,
        },
      }
      // 로컬 상태만 먼저 업데이트
      setSession(sessionWithDummy)
      setCodeLocal(sessionWithDummy.code || '')
      dummyDataUpdatedRef.current = true
      // updateSession을 다음 틱에 실행하여 초기 렌더링 루프 방지
      setTimeout(() => {
        if (!dummyDataUpdatedRef.current) return // 이미 처리되었으면 스킵
        updateSession(loadedSession.id, { problem: sessionWithDummy.problem })
      }, 0)
    } else {
      setSession(loadedSession)
      setCodeLocal(loadedSession.code || '')
    }
  }, [params.sessionId]) // getSession, updateSession은 의존성에서 제거

  // 코드 변경 시 debounced 저장
  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || ''
    setCodeLocal(newCode)
    
    if (!session) return
    
    // 기존 timeout 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // 500ms 후 저장
    saveTimeoutRef.current = setTimeout(() => {
      setCode(session.id, newCode)
      setSession((prev) => prev ? { ...prev, code: newCode } : undefined)
    }, 500)
  }, [session, setCode])

  // 언어 변경
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!session) return
    const newLanguage = e.target.value as Session['language']
    updateSession(session.id, { language: newLanguage })
    setSession((prev) => prev ? { ...prev, language: newLanguage } : undefined)
  }

  // Run 버튼
  const handleRun = () => {
    if (!session) return
    const output = 'Ran successfully\n\nTest cases passed: 3/3'
    updateSession(session.id, { runOutput: output })
    setSession((prev) => prev ? { ...prev, runOutput: output } : undefined)
  }

  // n8n 페이로드 빌드 및 전송
  const sendToN8n = async (session: Session, code: string) => {
    if (!WEBHOOK_URL) {
      console.log('WEBHOOK_URL이 설정되지 않아 n8n으로 전송하지 않습니다.')
      return
    }

    // problemId는 문제 ID 또는 제목 사용
    const problemId = session.problem.id || session.problem.title || 'A001'

    const payload: N8nPayload = {
      userId: 'test-user', // 고정값
      problemId: problemId,
      language: 'python', // 고정값 (요구사항)
      code: code.trim(),
      timeSpent: elapsedSeconds, // 초 단위로 전달
      hintUsed: hintUsed,
      selfReportDifficulty: selfReportDifficulty,
    }

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

      console.log('n8n으로 전송 성공:', payload)
    } catch (error) {
      console.error('n8n 전송 중 오류:', error)
      // 에러가 발생해도 제출은 계속 진행
    }
  }

  // Submit 버튼
  const handleSubmit = async () => {
    if (!session) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // n8n으로 데이터 전송
      await sendToN8n(session, code)

      const judgeResult = await submitToJudge(session)
      
      setJudgeResult(session.id, judgeResult)
      updateSession(session.id, { status: 'SUBMITTED' })
      const updatedSession = {
        ...session,
        judge: judgeResult,
        status: 'SUBMITTED' as const,
      }
      setSession(updatedSession)
      
      // 판정 결과로 스크롤
      setTimeout(() => {
        judgeResultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)

      // 자동 로그 프롬프트 표시 (로그가 아직 저장되지 않은 경우에만)
      if (!session.loggedAt) {
        setTimeout(() => {
          setShowQuickLog(true)
        }, 500) // 판정 결과를 본 후 모달 표시
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '제출 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // QuickLog 저장 핸들러
  const handleQuickLogSave = (difficulty: number, result: 'success' | 'failure') => {
    if (!session) return
    setLog(session.id, difficulty, result)
    // 세션 상태는 store에서 자동으로 업데이트되므로 여기서는 업데이트하지 않음
    // 모달이 닫히면 자동으로 최신 세션 정보가 반영됨
  }

  // cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // 세션이 없으면 빈 상태 표시
  if (!session) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">
              세션을 찾을 수 없어요
            </h2>
            <p className="text-sm text-text-muted">
              이 세션이 존재하지 않거나 삭제되었을 수 있어요.
            </p>
            <Link href="/start">
              <Button variant="primary" size="md" className="w-full">
                새 세션 시작하기
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  // Monaco 언어 매핑
  const monacoLanguage = session.language === 'javascript' ? 'javascript' :
                         session.language === 'typescript' ? 'typescript' :
                         'python'

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary mb-2">
                {session.problem.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs font-medium', getPlatformColor(session.problem.platform))}>
                  {session.problem.platform}
                </span>
                <span className="text-text-muted text-xs">•</span>
                <span className={cn('text-xs font-medium', getDifficultyColor(session.problem.difficulty))}>
                  {session.problem.difficulty}
                </span>
                <span className="text-text-muted text-xs">•</span>
                <span className="text-xs text-text-muted">
                  세션
                </span>
              </div>
            </div>
            <Link href="/home">
              <Button variant="ghost" size="sm">
                홈
              </Button>
            </Link>
          </div>

          {/* 시간 측정기 및 체감 난이도 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
            {/* 시간 측정기 */}
            <Card className="px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">소요 시간:</span>
                <span className="text-sm font-mono text-text-primary">
                  {Math.floor(elapsedSeconds / 60)}분 {elapsedSeconds % 60}초
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTimerToggle}
                  className="text-xs"
                >
                  {isTimerRunning ? '일시정지' : '시작'}
                </Button>
              </div>
            </Card>

            {/* 체감 난이도 */}
            <Card className="px-4 py-2 flex-1 sm:flex-initial min-w-[200px]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary whitespace-nowrap">체감 난이도:</span>
                <div className="flex-1 flex items-center gap-2">
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={selfReportDifficulty}
                    onChange={(e) => setSelfReportDifficulty(parseInt(e.target.value, 10))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-text-primary min-w-[30px]">
                    {selfReportDifficulty}/5
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Editor Section */}
        <div className="space-y-4">
          {/* Language Selector + Editor + Problem Panel */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Editor Column */}
            <div className={cn('flex-1 min-w-0', showProblemPanel && 'md:w-[calc(100%-400px)]')}>
              <Card className="p-0 overflow-hidden">
                <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3">
                  <Select
                    value={session.language}
                    onChange={handleLanguageChange}
                    className="w-auto min-w-[120px]"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProblemPanel(!showProblemPanel)}
                    className="text-xs"
                  >
                    {showProblemPanel ? '문제 숨기기' : '문제 보기'}
                  </Button>
                </div>
                <div className="h-[400px] md:h-[500px]">
                  <MonacoEditor
                    language={monacoLanguage}
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              </Card>
            </div>

            {/* Problem Panel - Desktop: Side panel, Mobile: Collapsible */}
            {showProblemPanel && (
              <div className={cn(
                'md:w-[380px] md:flex-shrink-0',
                'md:block',
                'md:sticky md:top-4 md:self-start',
                'md:max-h-[calc(100vh-2rem)] md:overflow-y-auto'
              )}>
                <Card className="h-full">
                  <div className="space-y-4">
                    {/* Problem Header */}
                    <div className="pb-4 border-b border-[rgba(255,255,255,0.06)]">
                      <h2 className="text-lg font-semibold text-text-primary mb-2">
                        {session.problem.title}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-xs font-medium', getPlatformColor(session.problem.platform))}>
                          {session.problem.platform}
                        </span>
                        <span className="text-text-muted text-xs">•</span>
                        <span className={cn('text-xs font-medium', getDifficultyColor(session.problem.difficulty))}>
                          {session.problem.difficulty}
                        </span>
                        {session.problem.tags.length > 0 && (
                          <>
                            <span className="text-text-muted text-xs">•</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {session.problem.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="muted" className="text-[10px] py-0 px-1.5 h-4">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Problem Statement */}
                    {session.problem.statement && (
                      <div className="text-sm text-text-muted leading-relaxed">
                        <pre className="whitespace-pre-wrap font-sans text-text-muted">
                          {session.problem.statement}
                        </pre>
                      </div>
                    )}

                    {/* Constraints */}
                    {session.problem.constraints && (
                      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        <h3 className="text-sm font-medium text-text-primary mb-2">
                          제약 조건
                        </h3>
                        <pre className="text-xs text-text-muted font-mono whitespace-pre-wrap leading-relaxed">
                          {session.problem.constraints}
                        </pre>
                      </div>
                    )}

                    {/* Test Cases */}
                    {session.problem.testCases && session.problem.testCases.length > 0 && (
                      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        <h3 className="text-sm font-medium text-text-primary mb-3">
                          테스트 케이스
                        </h3>
                        <div className="space-y-3">
                          {session.problem.testCases.map((testCase, idx) => (
                            <div
                              key={testCase.testCaseId || idx}
                              className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-background-secondary/50 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-text-secondary">
                                  테스트 케이스 {testCase.testCaseId || idx + 1}
                                </span>
                                {testCase.isHidden && (
                                  <Badge variant="muted" className="text-[10px] py-0 px-1.5 h-4">
                                    숨김
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-text-secondary mb-1">입력</div>
                                <pre className="text-xs text-text-muted font-mono whitespace-pre-wrap bg-background-tertiary p-2 rounded border border-[rgba(255,255,255,0.04)]">
                                  {testCase.input || '(없음)'}
                                </pre>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-text-secondary mb-1">예상 출력</div>
                                <pre className="text-xs text-text-muted font-mono whitespace-pre-wrap bg-background-tertiary p-2 rounded border border-[rgba(255,255,255,0.04)]">
                                  {testCase.expectedOutput}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 힌트 섹션 */}
                    <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-text-primary">
                          힌트
                        </h3>
                        {!showHint && !showHintConfirm && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleShowHint}
                            className="text-xs"
                          >
                            힌트 보기
                          </Button>
                        )}
                        {showHint && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowHint(false)}
                            className="text-xs"
                          >
                            힌트 숨기기
                          </Button>
                        )}
                      </div>
                      
                      {/* 확인 메시지 */}
                      {showHintConfirm && (
                        <div className="mt-2 p-4 rounded-[8px] bg-background-tertiary border border-accent/30">
                          <p className="text-sm text-text-primary mb-4 leading-relaxed">
                            정말 힌트를 보시겠습니까?
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleConfirmHint}
                              className="text-xs"
                            >
                              확인
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCancelHint}
                              className="text-xs"
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 힌트 내용 */}
                      {showHint && (
                        <div className="mt-2 p-3 rounded-[8px] bg-background-tertiary border border-[rgba(255,255,255,0.06)]">
                          <p className="text-sm text-text-muted leading-relaxed">
                            해시 테이블을 사용하면 O(n) 시간 복잡도로 해결할 수 있습니다. 
                            각 숫자와 그 인덱스를 해시 맵에 저장하고, target - 현재 숫자가 
                            해시 맵에 있는지 확인하면 됩니다.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mobile: Close button */}
                    <div className="md:hidden pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowProblemPanel(false)}
                        className="w-full"
                      >
                        닫기
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Buttons Row */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleRun}
            >
              Run
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
            >
              {isSubmitting ? '제출 중...' : 'Submit'}
            </Button>
          </div>

          {/* Error Message */}
          {submitError && (
            <Card className="border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400">{submitError}</p>
            </Card>
          )}

          {/* Run Output */}
          {session.runOutput && (
            <Card>
              <div className="mb-2">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  실행 결과
                </span>
              </div>
              <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap">
                {session.runOutput}
              </pre>
            </Card>
          )}

          {/* Judge Result */}
          {session.judge && (
            <Card ref={judgeResultRef}>
              <div className="space-y-6">
                {/* Result Summary Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant="muted"
                      className={cn('text-xs font-medium', getVerdictColor(session.judge.verdict))}
                    >
                      {getVerdictStatusLabel(session.judge.verdict)}
                    </Badge>
                    {session.judge.confidence !== undefined && (
                      <span className="text-sm text-text-muted">
                        신뢰도 {Math.round(session.judge.confidence * 100)}%
                      </span>
                    )}
                    {session.judge.time_complexity && (
                      <span className="text-sm text-text-muted">
                        시간 복잡도: {session.judge.time_complexity}
                      </span>
                    )}
                  </div>
                  <Link href={`/check/${session.id}`} className="flex-shrink-0">
                    <Button variant="primary" size="md" className="w-full sm:w-auto">
                      이해도 확인하기
                    </Button>
                  </Link>
                </div>

                {/* Body Content - 2-column layout on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: 판정 이유 */}
                  {session.judge.reasons.length > 0 && (
                    <div>
                      <h3 className="text-base font-medium text-text-primary mb-3">
                        판정 이유
                      </h3>
                      <ul className="space-y-2.5">
                        {session.judge.reasons.map((reason, idx) => (
                          <li key={idx} className="text-sm text-text-muted flex items-start gap-2.5 leading-relaxed">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Right Column: 엣지 케이스 + 시간 복잡도 */}
                  <div className="space-y-6">
                    {(session.judge.edge_cases_to_test && session.judge.edge_cases_to_test.length > 0) ||
                     (session.judge.edge_cases && session.judge.edge_cases.length > 0) ? (
                      <div>
                        <h3 className="text-base font-medium text-text-primary mb-3">
                          엣지 케이스
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(session.judge.edge_cases_to_test || session.judge.edge_cases || []).map((edgeCase, idx) => (
                            <Badge
                              key={idx}
                              variant="muted"
                              className="text-xs"
                            >
                              {edgeCase}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {session.judge.time_complexity && (
                      <div>
                        <h3 className="text-base font-medium text-text-primary mb-2">
                          시간 복잡도
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">{session.judge.time_complexity}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={showQuickLog}
        onClose={() => setShowQuickLog(false)}
        onSave={handleQuickLogSave}
        session={session}
      />
    </div>
  )
}
